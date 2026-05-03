import { forwardRef, Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LobbyService } from '../lobby/lobby.service';
import { MaintenanceType } from '../maintenance/maintenance.entity';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { SocketDispatcher } from '../socket/dispatcher/dispatcher';
import { BlackjackGame, BlackjackGameStatus } from './blackjack-game.entity';
import { BlackjackService } from './blackjack.service';
import { LobbyState } from '../lobby/lobby.entity';
import { ServiceError } from 'src/common/service.error';

interface StateTransition {
  status: BlackjackGameStatus;
  action: (game: BlackjackGame) => Promise<void>;
  nextDelay?: number;
  retryable: boolean;
}

interface TimerData {
  type: 'player_turn' | 'insurance' | 'deal_now' | 'next_game' | 'game_start' | 'inactivity' | 'state_transition';
  gameId?: string;
  lobbyId: string;
  userId?: string;
}

/**
 * NOTE on horizontal scaling: this manager keeps per-lobby state (timers,
 * insurance/deal-now responses, player counts, processing flags) in
 * process-local Maps. That means the backend MUST run as a single instance.
 * If you ever need >1 node, this state has to move to Redis (or an equivalent
 * shared store) and the in-memory Maps below have to be replaced with
 * distributed primitives. Until then, do not start a second backend pod.
 */
@Injectable()
export class BlackjackManager implements OnApplicationBootstrap {
  private readonly logger = new Logger('BlackjackManager');
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 3000, 5000];

  private insuranceResponses: Map<string, Set<string>> = new Map();
  private dealNowResponses: Map<string, Set<string>> = new Map();
  private playerCounts: Map<string, number> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private processingStates: Map<string, boolean> = new Map();

  private readonly stateTransitions: Map<BlackjackGameStatus, StateTransition>;

  constructor(
    @InjectRepository(BlackjackGame) private readonly blackjackGameRepository: Repository<BlackjackGame>,
    @Inject(forwardRef(() => BlackjackService))
    private readonly blackjackService: BlackjackService,
    private readonly maintenanceService: MaintenanceService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly lobbyService: LobbyService,
    private readonly dispatcher: SocketDispatcher,
  ) {
    this.stateTransitions = new Map([
      [
        BlackjackGameStatus.WAITING_BETS,
        {
          status: BlackjackGameStatus.WAITING_BETS,
          action: async () => {},
          retryable: false,
        },
      ],
      [
        BlackjackGameStatus.WAITING_PLAYERS,
        {
          status: BlackjackGameStatus.WAITING_PLAYERS,
          action: async () => {},
          retryable: false,
        },
      ],
      [
        BlackjackGameStatus.COUNTDOWN,
        {
          status: BlackjackGameStatus.COUNTDOWN,
          action: async (game: { id: string; lobbyId: string }) => {
            await this.blackjackService.startGame(game.id);
            await this.blackjackService.getCurrentGameAndEmit(game.lobbyId);
          },
          retryable: true,
        },
      ],
      [
        BlackjackGameStatus.DEALING,
        {
          status: BlackjackGameStatus.DEALING,
          action: async (game: BlackjackGame) => {
            if (!game.fairnessRandom || !game.deck || game.deck.length === 0) {
              this.logger.error(`Game ${game.id} in DEALING status has no deck - refunding and restarting`);

              try {
                const fullGame = await this.blackjackService.findById(game.id);
                if (fullGame) {
                  // Only kick players who actually had bets — sittees who hadn't bet
                  // yet should keep their seat for the next round.
                  const playersWithBets = fullGame.players.filter((p) => (p.bets?.length ?? 0) > 0);
                  for (const player of playersWithBets) {
                    await this.blackjackService.leaveGame(
                      player.userId,
                      game.lobbyId,
                      'Game failed to start due to a server error. Your bets have been refunded.',
                      true,
                    );
                  }
                  this.logger.log(
                    `Kicked ${playersWithBets.length} of ${fullGame.players.length} players from incomplete dealing game ${game.id}`,
                  );
                }
              } catch (kickError) {
                this.logger.error(`Failed to kick players from game ${game.id}:`, kickError);
              }

              await this.blackjackService.getCurrentGameAndEmit(game.lobbyId);
              this.scheduleNextGame(game.lobbyId, 2);
              return;
            }

            const finished = await this.blackjackService.checkAndFinishRound(game.id);
            if (!finished) {
              await this.blackjackService.advanceToNextPlayer(game.id);
            }
          },
          retryable: true,
        },
      ],
      [
        BlackjackGameStatus.PLAYING,
        {
          status: BlackjackGameStatus.PLAYING,
          action: async (game: { id: string }) => {
            const finished = await this.blackjackService.checkAndFinishRound(game.id);
            if (!finished) {
              await this.blackjackService.advanceToNextPlayer(game.id);
            }
          },
          retryable: true,
        },
      ],
      [
        BlackjackGameStatus.DEALER_PLAYING,
        {
          status: BlackjackGameStatus.DEALER_PLAYING,
          action: async (game: BlackjackGame) => {
            this.cancelAllGameTimers(game);
            await this.blackjackService.playDealerHand(game);
          },
          retryable: true,
        },
      ],
      [
        BlackjackGameStatus.RESOLVING_BETS,
        {
          status: BlackjackGameStatus.RESOLVING_BETS,
          action: async (game: BlackjackGame) => {
            await this.blackjackService.resolvePlayerWinnings(game);
            await this.blackjackService.resolvePlayerPayoutsAndStats(game);
            await this.blackjackGameRepository.update({ id: game.id }, { status: BlackjackGameStatus.FINISHED });
            await this.blackjackService.getCurrentGameAndEmit(game.lobbyId);
            this.scheduleNextGame(game.lobbyId, 2);
            this.dispatcher.emitGameStats(game.lobbyId);
          },
          retryable: true,
        },
      ],
      [
        BlackjackGameStatus.RESOLVING_USER_PAYOUTS,
        {
          status: BlackjackGameStatus.RESOLVING_USER_PAYOUTS,
          action: async (game: BlackjackGame) => {
            await this.blackjackService.resolvePlayerPayoutsAndStats(game);
            await this.blackjackGameRepository.update({ id: game.id }, { status: BlackjackGameStatus.FINISHED });
            await this.blackjackService.getCurrentGameAndEmit(game.lobbyId);
            this.scheduleNextGame(game.lobbyId, 2);
            this.dispatcher.emitGameStats(game.lobbyId);
          },
          retryable: true,
        },
      ],
      [
        BlackjackGameStatus.FINISHED,
        {
          status: BlackjackGameStatus.FINISHED,
          action: async (game: { lobbyId: string }) => {
            await this.blackjackService.getCurrentGameAndEmit(game.lobbyId);
            this.scheduleNextGame(game.lobbyId, 2);
            this.dispatcher.emitGameStats(game.lobbyId);
          },
          retryable: false,
        },
      ],
    ]);
  }

  async onApplicationBootstrap() {
    this.logger.log('Initializing blackjack state machine. Loading unfinished games...');
    const games = await this.blackjackService.getUnfinishedGames();
    this.logger.log(`Found ${games.length} games requiring recovery`);

    for (const game of games) {
      this.retryAttempts.set(game.lobbyId, 0);
      this.scheduleStateTransition(game.lobbyId, 5000);
    }
  }

  public async processGameState(lobbyId: string): Promise<void> {
    if (this.processingStates.get(lobbyId)) {
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

      const game = await this.blackjackService.createOrGetActiveGame(lobbyId);
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

  private canTransitionState(game: BlackjackGame): boolean {
    const stableStates = [BlackjackGameStatus.WAITING_BETS, BlackjackGameStatus.WAITING_PLAYERS];

    if (stableStates.includes(game.status)) {
      return false;
    }

    if (game.status === BlackjackGameStatus.COUNTDOWN) {
      const timeSinceUpdate = Date.now() - game.updatedAt.getTime();
      return timeSinceUpdate > 15000;
    }

    return true;
  }

  private async executeStateTransition(game: BlackjackGame): Promise<void> {
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
      const game = await this.blackjackService.getActiveGame(lobbyId);
      if (game) {
        this.logger.error(`Unrecoverable error for game ${game.id} in status ${game.status}`);

        this.cancelAllGameTimers(game);

        if (game.status === BlackjackGameStatus.COUNTDOWN || game.status === BlackjackGameStatus.DEALING) {
          try {
            await this.blackjackService.refundAllBets(game.id);
            this.logger.log(`Refunded all bets for failed game ${game.id}`);
          } catch (refundError) {
            this.logger.error(`Failed to refund bets for game ${game.id}:`, refundError);
          }

          try {
            const playersWithBets = game.players.filter((p) => (p.bets?.length ?? 0) > 0);
            for (const player of playersWithBets) {
              await this.blackjackService.leaveGame(
                player.userId,
                game.lobbyId,
                'Game failed to start after multiple attempts. Your bets have been refunded.',
                true,
              );
            }
            this.logger.log(
              `Kicked ${playersWithBets.length} of ${game.players.length} players from failed game ${game.id}`,
            );
          } catch (kickError) {
            this.logger.error(`Failed to kick players from game ${game.id}:`, kickError);
          }

          await this.blackjackGameRepository.update({ id: game.id }, { status: BlackjackGameStatus.WAITING_BETS });
        }

        await this.blackjackService.getCurrentGameAndEmit(lobbyId);

        this.scheduleNextGame(lobbyId, 2);
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
      const timerKey = `blackjack-state-${lobbyId}`;

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
      case 'player_turn':
        return `blackjack-turn-${data.gameId}-${data.userId}`;
      case 'insurance':
        return `blackjack-insurance-${data.lobbyId}`;
      case 'deal_now':
        return `blackjack-dealnow-${data.lobbyId}`;
      case 'next_game':
        return `blackjack-nextgame-${data.lobbyId}`;
      case 'game_start':
        return `blackjack-gamestart-${data.lobbyId}`;
      case 'inactivity':
        return `blackjack-inactivity-${data.lobbyId}-${data.userId}`;
      case 'state_transition':
        return `blackjack-state-${data.lobbyId}`;
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

  startPlayerTimer(gameId: string, userId: string, delay = 10): void {
    this.scheduleTimer({ type: 'player_turn', gameId, lobbyId: '', userId }, delay, async () => {
      try {
        const game = await this.blackjackGameRepository.findOne({ where: { id: gameId } });
        if (!game || game.currentPlayerId !== userId) return;

        await this.blackjackService.playerStand(userId, game);
        this.cancelPlayerTimer(game.id, userId);

        this.scheduleStateTransition(game.lobbyId, 200);
      } catch (error) {
        this.logger.error(`Error in player timer for user ${userId}, game ${gameId}:`, error);
      }
    });
  }

  cancelPlayerTimer(gameId: string, userId: string): void {
    this.cancelTimer({ type: 'player_turn', gameId, lobbyId: '', userId });
  }

  initializeInsuranceTracking(gameId: string): void {
    try {
      if (!this.insuranceResponses.has(gameId)) {
        this.insuranceResponses.set(gameId, new Set());
      }
    } catch (error) {
      this.logger.error(`Error initializing insurance tracking for game ${gameId}:`, error);
    }
  }

  trackInsuranceResponse(gameId: string, playerId: string): void {
    try {
      if (!this.insuranceResponses.has(gameId)) {
        this.insuranceResponses.set(gameId, new Set());
      }
      this.insuranceResponses.get(gameId)!.add(playerId);
    } catch (error) {
      this.logger.error(`Error tracking insurance response for player ${playerId}, game ${gameId}:`, error);
    }
  }

  hasPlayerRespondedToInsurance(gameId: string, playerId: string): boolean {
    try {
      const respondedSet = this.insuranceResponses.get(gameId);
      return respondedSet ? respondedSet.has(playerId) : false;
    } catch (error) {
      this.logger.error(`Error checking insurance response for player ${playerId}, game ${gameId}:`, error);
      return false;
    }
  }

  startInsuranceTimer(lobbyId: string, gameId: string, delay = 10): void {
    try {
      this.initializeInsuranceTracking(gameId);

      this.scheduleTimer({ type: 'insurance', lobbyId }, delay, async () => {
        try {
          const game = await this.blackjackService.getActiveGame(lobbyId);
          if (!game) return;
          await this.blackjackService.checkForInsurance(game);
        } catch (error) {
          this.logger.error(`Error in insurance timer for lobby ${lobbyId}:`, error);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to start insurance timer for lobby ${lobbyId}:`, error);
    }
  }

  isInsuranceTimerActive(lobbyId: string): boolean {
    try {
      const key = this.getTimerKey({ type: 'insurance', lobbyId });
      return this.schedulerRegistry.doesExist('timeout', key);
    } catch (error) {
      this.logger.error(`Error checking insurance timer status for lobby ${lobbyId}:`, error);
      return false;
    }
  }

  async cancelInsuranceTimer(lobbyId: string): Promise<void> {
    try {
      this.cancelTimer({ type: 'insurance', lobbyId });
      const game = await this.blackjackService.createOrGetActiveGame(lobbyId);
      if (!game) return;
      await this.blackjackService.checkForInsurance(game);
    } catch (error) {
      this.logger.error(`Error canceling insurance timer for lobby ${lobbyId}:`, error);
    }
  }

  startUserInactivityTimer(lobbyId: string, userId: string): void {
    this.scheduleTimer({ type: 'inactivity', lobbyId, userId }, 300, async () => {
      try {
        const game = await this.blackjackService.getActiveGame(lobbyId);
        if (!game) return;

        if (
          game.status === BlackjackGameStatus.DEALING ||
          game.status === BlackjackGameStatus.PLAYING ||
          game.status === BlackjackGameStatus.DEALER_PLAYING ||
          game.status === BlackjackGameStatus.RESOLVING_BETS ||
          game.status === BlackjackGameStatus.RESOLVING_USER_PAYOUTS ||
          game.status === BlackjackGameStatus.FINISHED
        )
          return;

        await this.blackjackService.leaveGame(userId, lobbyId, 'You have been kicked out due to inactivity');
        await this.blackjackService.getCurrentGameAndEmit(game.lobbyId);
      } catch (error) {
        this.logger.error(
          `Error in inactivity timer for user ${userId}, lobby ${lobbyId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    });
  }

  cancelInactivityTimer(lobbyId: string, userId: string): void {
    this.cancelTimer({ type: 'inactivity', lobbyId, userId });
  }

  resetInactivityTimer(lobbyId: string, userId: string): void {
    this.cancelInactivityTimer(lobbyId, userId);
    this.startUserInactivityTimer(lobbyId, userId);
  }

  trackDealNowResponse(lobbyId: string, playerId: string): void {
    try {
      if (!this.dealNowResponses.has(lobbyId)) {
        this.dealNowResponses.set(lobbyId, new Set());
      }
      this.dealNowResponses.get(lobbyId)!.add(playerId);
      this.blackjackService.checkForCurrentDealNowCount(lobbyId);
    } catch (error) {
      this.logger.error(`Error tracking deal now response for player ${playerId}, lobby ${lobbyId}:`, error);
    }
  }

  async cancelDealNowTimer(lobbyId: string): Promise<void> {
    try {
      this.cancelTimer({ type: 'deal_now', lobbyId });
      const game = await this.blackjackService.createOrGetActiveGame(lobbyId);
      if (!game) return;
      await this.blackjackService.checkForDealNow(game);
    } catch (error) {
      this.logger.error(`Error canceling deal now timer for lobby ${lobbyId}:`, error);
    }
  }

  cancelAllGameTimers(game: BlackjackGame): void {
    try {
      this.cancelTimer({ type: 'deal_now', lobbyId: game.lobbyId });
      this.cancelTimer({ type: 'game_start', lobbyId: game.lobbyId });
      this.cancelTimer({ type: 'insurance', lobbyId: game.lobbyId });

      for (const player of game.players) {
        try {
          this.cancelTimer({ type: 'player_turn', gameId: game.id, lobbyId: game.lobbyId, userId: player.userId });
        } catch (error) {
          this.logger.error(`Error canceling player timer for user ${player.userId}:`, error);
        }
      }

      this.insuranceResponses.delete(game.id);
      this.dealNowResponses.delete(game.lobbyId);
    } catch (error) {
      this.logger.error(`Error canceling all game timers for game ${game.id}:`, error);
    }
  }

  scheduleNextGame(lobbyId: string, delay = 3): void {
    this.scheduleTimer({ type: 'next_game', lobbyId }, delay, async () => {
      try {
        const game = await this.blackjackService.getActiveGame(lobbyId);
        if (!game) {
          this.logger.error(`Can't find latest game for lobby ${lobbyId}`);
          return;
        }

        if (game.status === BlackjackGameStatus.FINISHED) {
          await this.blackjackGameRepository.update({ id: game.id }, { isCurrent: false });
        }

        if (await this.maintenanceService.isInMaintenance([MaintenanceType.PAUSE, MaintenanceType.PAUSE_BLACKJACK])) {
          this.dispatcher.emitBlackjackMaintenanceStatusUpdated(lobbyId);
          throw new ServiceError('Creating a new Blackjack game has been paused.');
        }

        const newGame = await this.blackjackService.createOrGetActiveGame(lobbyId);

        if (game.lobby.status !== LobbyState.ACTIVE) {
          return this.dispatcher.emitLobbyActiveStatusChange(game.lobbyId, game.lobby.code, game.lobby.status);
        }

        if (!newGame) {
          this.logger.error(`Can't create a new game for lobby ${lobbyId}`);
          return;
        }

        await this.blackjackService.getCurrentGameAndEmit(game.lobbyId);
        await this.blackjackService.prepareNextGame(newGame, game);
      } catch (error) {
        this.logger.error(`Error scheduling next game for lobby ${lobbyId}:`, error);
      }
    });
  }

  scheduleGameStart(lobbyId: string, delay = 10): void {
    this.scheduleTimer({ type: 'game_start', lobbyId }, delay, async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const game = await this.blackjackService.getActiveGame(lobbyId);
        if (!game) {
          this.logger.error(`Can't find latest game for lobby ${lobbyId}`);
          return;
        }
        if (game.status !== BlackjackGameStatus.COUNTDOWN) return;

        await this.retryOperation(
          async () => {
            await this.blackjackService.startGame(game.id);
            await this.blackjackService.getCurrentGameAndEmit(game.lobbyId);
          },
          `start game ${game.id}`,
          3,
        );
      } catch (error) {
        this.logger.error(`Error starting game for lobby ${lobbyId}:`, error);
        await this.handleUnrecoverableError(lobbyId);
      }
    });
  }

  cancelGameStart(lobbyId: string): void {
    this.cancelTimer({ type: 'game_start', lobbyId });
  }

  getInsuranceResponseCount(gameId: string): number {
    try {
      return this.insuranceResponses.get(gameId)?.size ?? 0;
    } catch (error) {
      this.logger.error(`Error getting insurance response count for game ${gameId}:`, error);
      return 0;
    }
  }

  getDealNowResponseCount(lobbyId: string): number {
    try {
      return this.dealNowResponses.get(lobbyId)?.size ?? 0;
    } catch (error) {
      this.logger.error(`Error getting deal now response count for lobby ${lobbyId}:`, error);
      return 0;
    }
  }

  getInsuranceResponses(gameId: string): Set<string> | undefined {
    try {
      return this.insuranceResponses.get(gameId);
    } catch (error) {
      this.logger.error(`Error getting insurance responses for game ${gameId}:`, error);
      return undefined;
    }
  }

  getDealNowResponses(lobbyId: string): Set<string> | undefined {
    try {
      return this.dealNowResponses.get(lobbyId);
    } catch (error) {
      this.logger.error(`Error getting deal now responses for lobby ${lobbyId}:`, error);
      return undefined;
    }
  }

  clearInsuranceResponses(gameId: string): void {
    try {
      this.insuranceResponses.delete(gameId);
    } catch (error) {
      this.logger.error(`Error clearing insurance responses for game ${gameId}:`, error);
    }
  }

  clearDealNowResponses(lobbyId: string): void {
    try {
      this.dealNowResponses.delete(lobbyId);
    } catch (error) {
      this.logger.error(`Error clearing deal now responses for lobby ${lobbyId}:`, error);
    }
  }

  incrementPlayerCount(lobbyId: string): void {
    try {
      const current = this.playerCounts.get(lobbyId) ?? 0;
      this.playerCounts.set(lobbyId, current + 1);
    } catch (error) {
      this.logger.error(`Error incrementing player count for lobby ${lobbyId}:`, error);
    }
  }

  decrementPlayerCount(lobbyId: string): void {
    try {
      const current = this.playerCounts.get(lobbyId) ?? 0;
      this.playerCounts.set(lobbyId, Math.max(0, current - 1));
    } catch (error) {
      this.logger.error(`Error decrementing player count for lobby ${lobbyId}:`, error);
    }
  }

  getPlayerCount(lobbyId: string): number {
    try {
      return this.playerCounts.get(lobbyId) ?? 0;
    } catch (error) {
      this.logger.error(`Error getting player count for lobby ${lobbyId}:`, error);
      return 0;
    }
  }

  setPlayerCount(lobbyId: string, count: number): void {
    try {
      this.playerCounts.set(lobbyId, count);
    } catch (error) {
      this.logger.error(`Error setting player count for lobby ${lobbyId}:`, error);
    }
  }

  clearPlayerCount(lobbyId: string): void {
    try {
      this.playerCounts.delete(lobbyId);
    } catch (error) {
      this.logger.error(`Error clearing player count for lobby ${lobbyId}:`, error);
    }
  }

  private cleanup(lobbyId: string): void {
    try {
      this.logger.debug(`Cleaning up resources for lobby ${lobbyId}`);

      // Clear all maps
      this.retryAttempts.delete(lobbyId);
      this.playerCounts.delete(lobbyId);
      this.dealNowResponses.delete(lobbyId);
      this.processingStates.delete(lobbyId);

      // Cancel all timer types for this lobby
      const timerTypes: TimerData['type'][] = ['state_transition', 'next_game', 'game_start', 'deal_now', 'insurance'];

      for (const type of timerTypes) {
        try {
          this.cancelTimer({ type, lobbyId });
        } catch {
          // Continue cleanup even if one timer fails
          this.logger.debug(`Failed to cancel ${type} timer for ${lobbyId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error during cleanup for lobby ${lobbyId}:`, error);
    }
  }
}
