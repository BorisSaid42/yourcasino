import { forwardRef, Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LobbyService } from '../lobby/lobby.service';
import { MaintenanceType } from '../maintenance/maintenance.entity';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { SocketDispatcher } from '../socket/dispatcher/dispatcher';
import { RouletteGame, RouletteGameStatus } from './roulette-game.entity';
import { RouletteService } from './roulette.service';
import { LobbyState } from '../lobby/lobby.entity';

interface StateTransition {
  status: RouletteGameStatus;
  action: (game: RouletteGame) => Promise<void>;
  nextDelay?: number;
  retryable: boolean;
}

interface TimerData {
  type: 'state_transition' | 'next_game' | 'game_start' | 'roll_now';
  gameId?: string;
  lobbyId: string;
  userId?: string;
}

/**
 * NOTE on horizontal scaling: like BlackjackManager, this keeps per-lobby
 * state in process-local Maps. The backend MUST run as a single instance
 * until these are migrated to Redis. Multiple nodes would each spin their
 * own roulette wheel.
 */
@Injectable()
export class RouletteManager implements OnApplicationBootstrap {
  private readonly logger = new Logger('RouletteManager');
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 3000, 5000];

  private rollNowResponses: Map<string, Set<string>> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private processingStates: Map<string, boolean> = new Map();
  private betOperationLocks: Map<string, boolean> = new Map();

  private readonly stateTransitions: Map<RouletteGameStatus, StateTransition>;

  constructor(
    @InjectRepository(RouletteGame) private readonly rouletteGameRepository: Repository<RouletteGame>,
    @Inject(forwardRef(() => RouletteService))
    private readonly rouletteService: RouletteService,
    private readonly maintenanceService: MaintenanceService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly lobbyService: LobbyService,
    private readonly dispatcher: SocketDispatcher,
  ) {
    this.stateTransitions = new Map([
      [
        RouletteGameStatus.WAITING_BETS,
        {
          status: RouletteGameStatus.WAITING_BETS,
          action: async () => {},
          retryable: false,
        },
      ],
      [
        RouletteGameStatus.COUNTDOWN,
        {
          status: RouletteGameStatus.COUNTDOWN,
          action: async (game: RouletteGame) => {
            await this.rouletteService.startGame(game.lobbyId);
            await this.rouletteService.getCurrentGameAndEmit(game.lobbyId);
            await this.delay(500);
            this.dispatcher.emitRouletteBallSpin(game.lobbyId);
            this.scheduleStateTransition(game.lobbyId, 5000);
          },
          retryable: true,
        },
      ],
      [
        RouletteGameStatus.PLAYING,
        {
          status: RouletteGameStatus.PLAYING,
          action: async (game: RouletteGame) => {
            await this.rouletteService.finishGame(game.lobbyId);
            await this.rouletteService.getCurrentGameAndEmit(game.lobbyId);
            this.scheduleNextGame(game.lobbyId, 5);
            this.dispatcher.emitRouletteGameStats(game.lobbyId);
          },
          retryable: true,
        },
      ],
      [
        RouletteGameStatus.FINISHED,
        {
          status: RouletteGameStatus.FINISHED,
          action: async (game: RouletteGame) => {
            await this.rouletteService.getCurrentGameAndEmit(game.lobbyId);
            this.scheduleNextGame(game.lobbyId, 3);
            this.dispatcher.emitRouletteGameStats(game.lobbyId);
          },
          retryable: false,
        },
      ],
    ]);
  }

  async onApplicationBootstrap() {
    this.logger.log('Initializing roulette state machine. Loading unfinished games...');
    const games = await this.rouletteService.getUnfinishedGames();
    this.logger.log(`Found ${games.length} games requiring recovery`);

    for (const game of games) {
      this.retryAttempts.set(game.lobbyId, 0);
      this.scheduleStateTransition(game.lobbyId, 5000);
    }
  }

  public async processGameState(lobbyId: string): Promise<void> {
    const currentValue = this.processingStates.get(lobbyId);
    if (currentValue === true) {
      this.logger.debug(`State already being processed for ${lobbyId}, skipping`);
      return;
    }

    this.processingStates.set(lobbyId, true);

    try {
      if (await this.maintenanceService.isInMaintenance(MaintenanceType.FULL)) {
        this.logger.warn(`Maintenance mode active - retrying in 1s for ${lobbyId}`);
        this.scheduleStateTransition(lobbyId, 1000);
        return;
      }

      const lobby = await this.lobbyService.getLobbyById(lobbyId);
      if (!lobby) {
        this.logger.warn(`Lobby ${lobbyId} not found - stopping state machine`);
        this.cleanup(lobbyId);
        return;
      }

      if (lobby.status !== LobbyState.ACTIVE) {
        this.logger.warn(`Lobby ${lobbyId} is not active (${lobby.status}) - stopping state machine`);
        this.cleanup(lobbyId);
        return;
      }

      const game = await this.rouletteService.createOrGetActiveGame(lobbyId);
      if (!game) {
        throw new Error(`Failed to get/create game for lobby ${lobbyId}`);
      }

      if (!this.canTransitionState(game)) {
        this.logger.debug(`State transition not needed for ${lobbyId} in status ${game.status}`);
        this.retryAttempts.set(lobbyId, 0);
        return;
      }

      await this.executeStateTransition(game);

      this.retryAttempts.set(lobbyId, 0);
    } catch (error) {
      await this.handleError(lobbyId, error);
    } finally {
      this.processingStates.set(lobbyId, false);
    }
  }

  private canTransitionState(game: RouletteGame): boolean {
    const stableStates = [RouletteGameStatus.WAITING_BETS];

    if (stableStates.includes(game.status)) {
      return false;
    }

    if (game.status === RouletteGameStatus.COUNTDOWN) {
      const timeSinceUpdate = Date.now() - game.updatedAt.getTime();
      return timeSinceUpdate > 10000;
    }

    if (game.status === RouletteGameStatus.PLAYING) {
      const timeSinceUpdate = Date.now() - game.updatedAt.getTime();
      return timeSinceUpdate > 5000;
    }

    return true;
  }

  private async executeStateTransition(game: RouletteGame): Promise<void> {
    const transition = this.stateTransitions.get(game.status);

    if (!transition) {
      throw new Error(`Unknown game status: ${game.status}`);
    }

    this.logger.debug(`Executing state transition: ${game.status} for game ${game.id}`);

    await transition.action(game);
  }

  private async handleError(lobbyId: string, error: any): Promise<void> {
    const attempts = this.retryAttempts.get(lobbyId) ?? 0;

    this.logger.error(`State machine error for ${lobbyId} (attempt ${attempts + 1}/${this.maxRetries})`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.logger.error(error.stack || error.message);

    if (attempts >= this.maxRetries) {
      this.logger.error(`Max retries reached for ${lobbyId} - entering error state`);
      await this.handleUnrecoverableError(lobbyId);
      return;
    }

    this.retryAttempts.set(lobbyId, attempts + 1);

    const delay = this.retryDelays[Math.min(attempts, this.retryDelays.length - 1)];
    this.logger.log(`Scheduling retry ${attempts + 1} in ${delay}ms for ${lobbyId}`);
    this.scheduleStateTransition(lobbyId, delay);
  }

  private async handleUnrecoverableError(lobbyId: string): Promise<void> {
    try {
      const game = await this.rouletteService.getActiveGame(lobbyId);
      if (game) {
        this.logger.error(`Unrecoverable error for game ${game.id} in status ${game.status}`);

        if (game.status === RouletteGameStatus.COUNTDOWN) {
          try {
            await this.rouletteService.refundAllBets(game.id);
            this.logger.log(`Refunded all bets for failed game ${game.id}`);
          } catch (refundError) {
            this.logger.error(`Failed to refund bets for game ${game.id}:`, refundError);
          }

          await this.rouletteGameRepository.update(
            { id: game.id },
            {
              status: RouletteGameStatus.WAITING_BETS,
              timerDeadline: null,
              timerType: null,
            },
          );
        }

        await this.rouletteService.getCurrentGameAndEmit(lobbyId);

        this.scheduleNextGame(lobbyId, 5);
      }
    } catch (error) {
      this.logger.error(`Failed to handle unrecoverable error for ${lobbyId}`, error);
    } finally {
      this.cleanup(lobbyId);
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    description: string,
    maxRetries: number = 3,
    delayMs: number = 1000,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Retry ${attempt}/${maxRetries} failed for ${description}:`, error);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw lastError;
  }

  public scheduleStateTransition(lobbyId: string, delayMs: number = 0): void {
    try {
      const timerKey = `roulette-state-${lobbyId}`;

      if (this.schedulerRegistry.doesExist('timeout', timerKey)) {
        this.schedulerRegistry.deleteTimeout(timerKey);
      }

      this.logger.debug(
        `Scheduling state transition for ${lobbyId} in ${delayMs > 0 ? delayMs + 'ms' : 'immediately'}`,
      );

      this.schedulerRegistry.addTimeout(
        timerKey,
        setTimeout(() => {
          this.processGameState(lobbyId).catch((error) => {
            this.logger.error(`Unhandled error in processGameState for ${lobbyId}:`, error);
          });
        }, delayMs),
      );
    } catch (error) {
      this.logger.error(`Failed to schedule state transition for ${lobbyId}:`, error);
    }
  }

  public schedule(lobbyId: string, timeout: number | null = 0): void {
    try {
      this.scheduleStateTransition(lobbyId, Math.max(0, timeout ?? 0));
    } catch (error) {
      this.logger.error(`Failed to schedule for lobby ${lobbyId}:`, error);
    }
  }

  private getTimerKey(data: TimerData): string {
    switch (data.type) {
      case 'roll_now':
        return `roulette-rollnow-${data.lobbyId}`;
      case 'next_game':
        return `roulette-nextgame-${data.lobbyId}`;
      case 'game_start':
        return `roulette-gamestart-${data.lobbyId}`;
      case 'state_transition':
        return `roulette-state-${data.lobbyId}`;
    }
  }

  private scheduleTimer(data: TimerData, delay: number, callback: () => Promise<void>): void {
    try {
      const key = this.getTimerKey(data);

      if (this.schedulerRegistry.doesExist('timeout', key)) {
        this.schedulerRegistry.deleteTimeout(key);
      }

      this.schedulerRegistry.addTimeout(
        key,
        setTimeout(() => {
          callback()
            .catch((error) => {
              this.logger.error(`Timer callback error for ${key}:`, error);
            })
            .finally(() => {
              if (this.schedulerRegistry.doesExist('timeout', key)) {
                this.schedulerRegistry.deleteTimeout(key);
              }
            });
        }, delay * 1000),
      );
    } catch (error) {
      this.logger.error(`Failed to schedule timer for ${data.type}:`, error);
    }
  }

  private cancelTimer(data: TimerData): void {
    try {
      const key = this.getTimerKey(data);
      if (this.schedulerRegistry.doesExist('timeout', key)) {
        this.schedulerRegistry.deleteTimeout(key);
      }
    } catch (error) {
      this.logger.error(`Failed to cancel timer for ${data.type}:`, error);
    }
  }

  trackRollNowResponse(lobbyId: string, playerId: string): void {
    try {
      if (!this.rollNowResponses.has(lobbyId)) {
        this.rollNowResponses.set(lobbyId, new Set());
      }
      this.rollNowResponses.get(lobbyId)!.add(playerId);
      this.rouletteService.checkForCurrentRollNowCount(lobbyId, this.getRollNowResponseCount(lobbyId));
    } catch (error) {
      this.logger.error(`Error tracking roll now response for player ${playerId}, lobby ${lobbyId}:`, error);
    }
  }

  async cancelRollNowTimer(lobbyId: string): Promise<void> {
    try {
      this.cancelTimer({ type: 'roll_now', lobbyId });
      this.cancelGameStart(lobbyId);
      const game = await this.rouletteService.createOrGetActiveGame(lobbyId);
      if (!game) return;
      await this.rouletteService.checkForRollNow(game);

      this.scheduleStateTransition(lobbyId, 5000);
    } catch (error) {
      this.logger.error(`Error canceling roll now timer for lobby ${lobbyId}:`, error);
    }
  }

  scheduleNextGame(lobbyId: string, delay = 5): void {
    this.scheduleTimer({ type: 'next_game', lobbyId }, delay, async () => {
      try {
        const game = await this.rouletteService.getActiveGame(lobbyId);
        if (!game) {
          this.logger.error(`Can't find latest game for lobby ${lobbyId}`);
          return;
        }

        if (game.status === RouletteGameStatus.FINISHED) {
          await this.rouletteGameRepository.update({ id: game.id }, { isCurrent: false });
        }

        if (await this.maintenanceService.isInMaintenance([MaintenanceType.PAUSE, MaintenanceType.PAUSE_ROULETTE])) {
          this.dispatcher.emitRouletteMaintenanceStatusUpdated(lobbyId);
          return;
        }

        const newGame = await this.rouletteService.createOrGetActiveGame(lobbyId);

        if (game.lobby.status !== LobbyState.ACTIVE) {
          return this.dispatcher.emitLobbyActiveStatusChange(game.lobbyId, game.lobby.code, game.lobby.status);
        }

        if (!newGame) {
          this.logger.error(`Can't create a new game for lobby ${lobbyId}`);
          return;
        }

        this.dispatcher.emitNewRouletteGame(newGame);
      } catch (error) {
        this.logger.error(`Error scheduling next game for lobby ${lobbyId}:`, error);
      }
    });
  }

  scheduleGameStart(lobbyId: string, delay = 10): void {
    this.scheduleTimer({ type: 'game_start', lobbyId }, delay, async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const game = await this.rouletteService.getActiveGame(lobbyId);
        if (!game) {
          this.logger.error(`Can't find latest game for lobby ${lobbyId}`);
          return;
        }
        if (game.status !== RouletteGameStatus.COUNTDOWN) return;

        if (!game.bets || game.bets.length === 0) {
          this.logger.warn(`Game ${game.id} has no bets - reverting to WAITING_BETS status`);
          await this.rouletteGameRepository.update(
            { id: game.id },
            { status: RouletteGameStatus.WAITING_BETS, timerDeadline: null, timerType: null },
          );
          await this.rouletteService.getCurrentGameAndEmit(game.lobbyId);
          return;
        }

        const userBetTotals = new Map<string, number>();
        for (const bet of game.bets) {
          const current = userBetTotals.get(bet.userId) || 0;
          userBetTotals.set(bet.userId, current + bet.amount);
        }

        const usersToRemove: string[] = [];
        for (const [userId, totalBet] of userBetTotals.entries()) {
          if (totalBet < game.lobby.rouletteMinBet) {
            usersToRemove.push(userId);
            this.logger.warn(
              `Removing bets for user ${userId} in game ${game.id} - total bet $${totalBet} below minimum $${game.lobby.rouletteMinBet}`,
            );
          }
        }

        if (usersToRemove.length > 0) {
          for (const userId of usersToRemove) {
            await this.rouletteService.handleClearBets(userId, lobbyId);
            const rollNowResponses = this.getRollNowResponses(lobbyId);
            if (rollNowResponses?.has(userId)) {
              rollNowResponses.delete(userId);
            }
          }

          const updatedGame = await this.rouletteService.getActiveGame(lobbyId);
          if (!updatedGame || !updatedGame.bets || updatedGame.bets.length === 0) {
            this.logger.warn(
              `Game ${game.id} has no remaining bets after removing below-minimum bets - reverting to WAITING_BETS`,
            );
            await this.rouletteGameRepository.update(
              { id: game.id },
              { status: RouletteGameStatus.WAITING_BETS, timerDeadline: null, timerType: null },
            );
            await this.rouletteService.getCurrentGameAndEmit(game.lobbyId);
            return;
          }

          const totalBetAmount = updatedGame.bets.reduce((sum, bet) => sum + bet.amount, 0);
          if (totalBetAmount < game.lobby.rouletteMinBet) {
            this.logger.warn(
              `Game ${game.id} total bets $${totalBetAmount} below minimum $${game.lobby.rouletteMinBet} after removals - reverting to WAITING_BETS`,
            );
            await this.rouletteGameRepository.update(
              { id: game.id },
              { status: RouletteGameStatus.WAITING_BETS, timerDeadline: null, timerType: null },
            );
            await this.rouletteService.getCurrentGameAndEmit(game.lobbyId);
            return;
          }
        }

        await this.retryOperation(
          async () => {
            await this.rouletteService.startGame(game.lobbyId);
            await this.rouletteService.getCurrentGameAndEmit(game.lobbyId);
            await this.delay(500);
            this.dispatcher.emitRouletteBallSpin(game.lobbyId);
          },
          `start game ${game.id}`,
          3,
        );

        this.scheduleStateTransition(lobbyId, 5000);
      } catch (error) {
        this.logger.error(`Error starting game for lobby ${lobbyId}:`, error);
        await this.handleUnrecoverableError(lobbyId);
      }
    });
  }

  cancelGameStart(lobbyId: string): void {
    this.cancelTimer({ type: 'game_start', lobbyId });
  }

  getRollNowResponseCount(lobbyId: string): number {
    try {
      return this.rollNowResponses.get(lobbyId)?.size ?? 0;
    } catch (error) {
      this.logger.error(`Error getting roll now response count for lobby ${lobbyId}:`, error);
      return 0;
    }
  }

  getRollNowResponses(lobbyId: string): Set<string> | undefined {
    try {
      return this.rollNowResponses.get(lobbyId);
    } catch (error) {
      this.logger.error(`Error getting roll now responses for lobby ${lobbyId}:`, error);
      return undefined;
    }
  }

  clearRollNowResponses(lobbyId: string): void {
    try {
      this.rollNowResponses.delete(lobbyId);
    } catch (error) {
      this.logger.error(`Error clearing roll now responses for lobby ${lobbyId}:`, error);
    }
  }

  acquireBetOperationLock(lobbyId: string): boolean {
    const currentValue = this.betOperationLocks.get(lobbyId);
    if (currentValue === true) {
      return false;
    }

    this.betOperationLocks.set(lobbyId, true);
    return true;
  }

  releaseBetOperationLock(lobbyId: string): void {
    this.betOperationLocks.set(lobbyId, false);
  }

  private cleanup(lobbyId: string): void {
    try {
      this.logger.debug(`Cleaning up resources for lobby ${lobbyId}`);

      this.retryAttempts.delete(lobbyId);
      this.rollNowResponses.delete(lobbyId);
      this.processingStates.delete(lobbyId);
      this.betOperationLocks.delete(lobbyId);

      const timerTypes: TimerData['type'][] = ['state_transition', 'next_game', 'game_start', 'roll_now'];

      for (const type of timerTypes) {
        try {
          this.cancelTimer({ type, lobbyId });
        } catch {
          this.logger.debug(`Failed to cancel ${type} timer for ${lobbyId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error during cleanup for lobby ${lobbyId}:`, error);
    }
  }

  private delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
}
