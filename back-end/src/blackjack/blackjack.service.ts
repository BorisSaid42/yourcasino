import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { MaintenanceType } from 'src/maintenance/maintenance.entity';
import { MaintenanceService } from 'src/maintenance/maintenance.service';
import { DataSource, EntityManager, In, LessThan, Not, QueryFailedError, Repository } from 'typeorm';
import { BlackjackPlayer } from '../blackjack-player/blackjack-player.entity';
import { BlackjackPlayerService } from '../blackjack-player/blackjack-player.service';
import { ServiceError } from '../common/service.error';
import { getRandomString } from '../common/utils';
import { BlackjackBetDto } from '../lobby/dto/blackjack-bet.dto';
import { JoinTableDto } from '../lobby/dto/join-table.dto';
import { LobbyDeatilStatisticsDTO } from '../lobby/dto/lobby-detail-stats.dto';
import { Lobby, LobbyState } from '../lobby/lobby.entity';
import { LobbyService } from '../lobby/lobby.service';
import { RandomOrgService } from '../random-org/random-org.service';
import { SocketDispatcher } from '../socket/dispatcher/dispatcher';
import { TransactionType } from '../transaction/lobby/lobby-transaction.entity';
import { BalanceLogType } from '../user/user-balance-log.entity';
import { UserService } from '../user/user.service';
import { BlackjackBet, BlackjackBetPlace } from './blackjack-bet.entity';
import { BlackjackGame, BlackjackGameStatus } from './blackjack-game.entity';
import { BlackjackHand } from './blackjack-hand.entity';
import { BlackjackManager } from './blackjack.manager';
import { BlackjackScheduler } from './blackjack.scheduler';
import { BlackjackGameStatisticsDTO } from './dto/blackjack-game-stats.dto';
import { BlackjackHandDTO } from './dto/blackjack-hand.dto';
import { ConfigService } from '../config/config.service';

interface BetSummary {
  betPlace: BlackjackBetPlace;
  totalAmount: number;
  possibleWin: number;
}

export type DealingEvent = {
  recipient: string;
  hand: BlackjackHandDTO | { handTotal: number; hand: string[] };
};

@Injectable()
export class BlackjackService {
  constructor(
    @InjectRepository(BlackjackGame) private readonly blackjackGameRepository: Repository<BlackjackGame>,
    @InjectRepository(BlackjackBet) private readonly blackjackBetRepository: Repository<BlackjackBet>,
    @InjectRepository(BlackjackHand) private readonly blackjackHandRepository: Repository<BlackjackHand>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly blackjackPlayerService: BlackjackPlayerService,
    private readonly lobbyService: LobbyService,
    private readonly userService: UserService,
    private readonly dispatcher: SocketDispatcher,
    private readonly blackjackScheduler: BlackjackScheduler,
    private readonly randomOrgService: RandomOrgService,
    @Inject(forwardRef(() => BlackjackManager))
    private readonly blackjackManager: BlackjackManager,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  public async findById(gameId: string): Promise<BlackjackGame | null> {
    return await this.blackjackGameRepository.findOne({
      where: { id: gameId },
      relations: ['lobby', 'lobby.owner', 'players', 'players.user', 'players.bets', 'players.hands'],
    });
  }

  async getLobbyDetailStatistics(ownerId: string, lobbyId: string): Promise<LobbyDeatilStatisticsDTO> {
    const lobby = await this.lobbyService.getLobbyById(lobbyId);
    if (!lobby) throw new ServiceError('Lobby not found');
    if (lobby.ownerId !== ownerId) throw new ServiceError('Lobby not owned by the user');

    const latestGamesRaw = await this.blackjackGameRepository
      .createQueryBuilder('game')
      .leftJoin('game.lobby', 'lobby')
      .leftJoin('game.players', 'player')
      .select(['game.id', 'game.updatedAt'])
      .addSelect('COUNT(DISTINCT player.id)', 'playersCount')
      .where('game.lobby_id = :lobbyId', { lobbyId })
      .andWhere('game.status = :status', { status: BlackjackGameStatus.FINISHED })
      .orderBy('game.updated_at', 'DESC')
      .groupBy('game.id')
      .limit(14)
      .getRawMany<{ playersCount: string; game_id: string; game_updated_at: Date }>();

    if (latestGamesRaw.length === 0) {
      return new LobbyDeatilStatisticsDTO({
        id: lobby.id,
        gameStats: [],
        netProfit: 0,
        wagered: 0,
        totalBets: 0,
        activatedAt: lobby.activatedAt,
      });
    }

    const latestGames = latestGamesRaw.reverse();

    const latestGameIds = latestGames.map((g) => g.game_id);

    const betsAggRawLatest = await this.blackjackBetRepository
      .createQueryBuilder('bet')
      .innerJoin('bet.player', 'player')
      .select('player.game_id', 'game_id')
      .addSelect('COALESCE(SUM(bet.amount), 0)', 'wagered')
      .addSelect('COALESCE(SUM(bet.amount - bet.wonAmount), 0)', 'netProfit')
      .andWhere('player.game_id IN (:...gameIds)', { gameIds: latestGameIds })
      .groupBy('player.game_id')
      .getRawMany<{ game_id: string; wagered: string; netProfit: string }>();

    const betsMapLatest = new Map(
      betsAggRawLatest.map((b) => [
        b.game_id,
        {
          wagered: Number(b.wagered),
          netProfit: Number(b.netProfit),
        },
      ]),
    );

    const totalPlayersCount = await this.blackjackPlayerService.getTotalPlayerCount(lobbyId);

    const gameStats: BlackjackGameStatisticsDTO[] = [];

    for (const game of latestGames) {
      const stats = betsMapLatest.get(game.game_id);
      if (stats && stats.netProfit !== 0) {
        gameStats.push({
          name: game.game_updated_at,
          value: stats.netProfit,
        });
      }
    }

    return new LobbyDeatilStatisticsDTO({
      id: lobby.id,
      gameStats,
      netProfit: lobby.blackjackProfitAmount,
      wagered: lobby.blackjackWagered,
      totalBets: totalPlayersCount,
      activatedAt: lobby.activatedAt,
    });
  }

  public async getUnfinishedGames(): Promise<BlackjackGame[]> {
    return await this.blackjackGameRepository.find({
      where: {
        lobby: {
          status: LobbyState.ACTIVE,
        },
        isCurrent: true,
        status: In([
          BlackjackGameStatus.PLAYING,
          BlackjackGameStatus.COUNTDOWN,
          BlackjackGameStatus.DEALING,
          BlackjackGameStatus.DEALER_PLAYING,
          BlackjackGameStatus.RESOLVING_BETS,
          BlackjackGameStatus.RESOLVING_USER_PAYOUTS,
          BlackjackGameStatus.FINISHED,
        ]),
      },
    });
  }

  public async getStuckPlaying(): Promise<BlackjackGame[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const games = await this.blackjackGameRepository.find({
      where: { isCurrent: true, status: In([BlackjackGameStatus.PLAYING]), updatedAt: LessThan(fiveMinutesAgo) },
    });

    return games;
  }

  public async findFairnessGameByLobbyId(lobbyId: string): Promise<BlackjackGame[]> {
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);

    return await this.blackjackGameRepository.find({
      where: {
        lobby: { id: lobbyId },
        status: BlackjackGameStatus.FINISHED,
        serverSeed: Not('NULL'),
        fairnessRandom: Not('NULL'),
        updatedAt: LessThan(fifteenSecondsAgo),
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async getCurrentGameAndEmit(lobbyId: string): Promise<void> {
    let game = await this.blackjackGameRepository.findOne({
      where: { lobby: { id: lobbyId }, isCurrent: true },
      relations: ['lobby', 'lobby.owner', 'players', 'players.user', 'players.bets', 'players.hands'],
    });
    if (!game) return;

    if (game.status === BlackjackGameStatus.COUNTDOWN && !game.players?.some((player) => player.bets?.length > 0)) {
      game.status = BlackjackGameStatus.WAITING_BETS;
      game = await this.blackjackGameRepository.save(game);
    }
    const isInsuranceTimerActive = this.blackjackManager.isInsuranceTimerActive(lobbyId);

    this.dispatcher.emitBlackjackGameUpdate(game, isInsuranceTimerActive);

    const maxWinTableWarning = this.calculateGroupedBets(game.players, game.lobby.bankroll);
    this.dispatcher.emitBlackjackMaxWinWarning(game.lobbyId, maxWinTableWarning);
  }

  calculateGroupedBets(players: BlackjackPlayer[], currentBankroll: number): boolean {
    let grouped: Record<BlackjackBetPlace, number> = {
      [BlackjackBetPlace.MAIN]: 0,
      [BlackjackBetPlace.SIDE21_3]: 0,
      [BlackjackBetPlace.PERFECT_PAIR]: 0,
    };

    for (const player of players) {
      grouped = player.bets.reduce((acc, bet) => {
        acc[bet.betPlace] = (acc[bet.betPlace] || 0) + bet.amount;
        return acc;
      }, grouped);
    }

    const results: BetSummary[] = Object.entries(grouped).map(([place, totalAmount]) => {
      const betPlace = place as BlackjackBetPlace;
      const multiplier =
        betPlace === BlackjackBetPlace.PERFECT_PAIR || betPlace === BlackjackBetPlace.SIDE21_3 ? 29 : 2;
      const possibleWin = totalAmount * multiplier;

      return { betPlace, totalAmount, possibleWin };
    });

    return results.some((result) => result.possibleWin > currentBankroll);
  }

  async getActiveGame(lobbyId: string): Promise<BlackjackGame | null> {
    return await this.blackjackGameRepository.findOne({
      where: { lobby: { id: lobbyId }, isCurrent: true },
      relations: ['lobby', 'lobby.owner', 'players', 'players.bets', 'players.user', 'players.hands'],
    });
  }

  async getCurrentPlayerHand(handId: string): Promise<BlackjackHand | null> {
    return await this.blackjackHandRepository.findOne({
      where: { id: handId },
      relations: ['player'],
    });
  }

  async save(game: BlackjackGame) {
    await this.blackjackGameRepository.save(game);
  }

  checkForCurrentDealNowCount(lobbyId: string): void {
    const respondedCount = this.blackjackManager.getDealNowResponseCount(lobbyId);
    this.dispatcher.emitDealNowCount(lobbyId, respondedCount);
  }

  async joinTable(data: JoinTableDto, userId: string): Promise<void> {
    const lobby = await this.lobbyService.getLobbyById(data.lobbyId);
    if (!lobby) throw new ServiceError('Lobby not found');

    if (lobby.ownerId === userId) {
      throw new ServiceError('As owner, you are not allowed to join or play in your lobbies');
    }

    const existingPlayer = await this.blackjackPlayerService.getCurrentPlayer(userId, data.lobbyId);

    if (existingPlayer) throw new ServiceError('You are already seated');

    const game = await this.createOrGetActiveGame(data.lobbyId);
    if (!game) {
      throw new ServiceError('No game found for the table');
    }

    if (game.players.length >= lobby.maxSeats) throw new ServiceError('Table is full');

    if (data.seatIndex < 0 || data.seatIndex >= lobby.maxSeats) {
      throw new ServiceError('Invalid seat index');
    }

    const seatOccupied = game.players.some((player) => player.seatIndex === data.seatIndex);
    if (seatOccupied) {
      throw new ServiceError('This seat is already occupied');
    }

    const user = await this.userService.findById(userId);
    if (!user) throw new ServiceError('User not found');

    if (user.balance <= 0) throw new ServiceError('Please add balance to be able to join');

    if (user.balance < lobby.minBet)
      throw new ServiceError(`Minimum bet for the table is $${lobby.minBet}. Please add balance to be able to join`);

    const newPlayer = await this.blackjackPlayerService.createPlayer(user.id, game.id, data.seatIndex);

    if (game.status === BlackjackGameStatus.WAITING_PLAYERS) {
      await this.blackjackGameRepository.update({ id: game.id }, { status: BlackjackGameStatus.WAITING_BETS });
      this.dispatcher.emitBlackjackStatusUpdate(game.lobbyId, BlackjackGameStatus.WAITING_BETS);
    }

    this.blackjackManager.startUserInactivityTimer(data.lobbyId, userId);

    this.dispatcher.emitPlayerJoined(data.lobbyId, newPlayer);
    this.dispatcher.emitPlayersUpdate(data.lobbyId, 'add', 'currentPlayerCount');
  }

  async leaveGame(userId: string, lobbyId: string, errorMessage?: string, force: boolean = false) {
    const game = await this.createOrGetActiveGame(lobbyId);
    if (!game) {
      throw new ServiceError(`No game found for the table ${lobbyId}`);
    }

    if (game.lobby.status !== LobbyState.ACTIVE) {
      throw new ServiceError('Lobby is not active');
    }

    const player = await this.blackjackPlayerService.getCurrentPlayer(userId, lobbyId, ['bets']);

    if (!player) {
      throw new ServiceError('Player not found');
    }

    this.blackjackManager.cancelInactivityTimer(lobbyId, userId);

    const userHasBets = player.bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (
      !force &&
      (game.status === BlackjackGameStatus.PLAYING ||
        game.status === BlackjackGameStatus.DEALING ||
        game.status === BlackjackGameStatus.DEALER_PLAYING ||
        game.status === BlackjackGameStatus.RESOLVING_USER_PAYOUTS ||
        game.status === BlackjackGameStatus.RESOLVING_BETS) &&
      userHasBets >= game.lobby.minBet
    ) {
      throw new ServiceError("You can't leave while in-game");
    }

    if (userHasBets > 0) {
      await this.dataSource.transaction(async (manager) => {
        await this.userService.updateBalance(userId, userHasBets, manager, {
          logType: BalanceLogType.GAME_PAYOUT,
          gameId: game.id,
          gameType: 'blackjack',
          playerId: player.id,
          lobbyId,
          reason: 'Bet refunded - player left game',
        });
        await manager.getRepository(BlackjackPlayer).delete({ id: player.id });
      });
    } else {
      await this.blackjackPlayerService.removePlayer(player.id);
    }

    this.blackjackManager.decrementPlayerCount(lobbyId);
    this.publishPlayerCount(lobbyId);

    if (game.players.length - 1 === 0) {
      game.status = BlackjackGameStatus.WAITING_PLAYERS;
      await this.blackjackGameRepository.update({ id: game.id }, { status: BlackjackGameStatus.WAITING_PLAYERS });
      this.dispatcher.emitBlackjackStatusUpdate(lobbyId, BlackjackGameStatus.WAITING_PLAYERS);
    }

    this.dispatcher.emitPlayerLeave(lobbyId, player);

    if (errorMessage) {
      this.dispatcher.emitPlayerError(userId, errorMessage);
    }

    this.dispatcher.emitPlayersUpdate(lobbyId, 'remove', 'currentPlayerCount');
  }

  publishPlayerCount(lobbyId: string): void {
    const count = this.blackjackManager.getPlayerCount(lobbyId);
    this.dispatcher.emitLobbyPlayerCount(lobbyId, count);
  }

  async createOrGetActiveGame(lobbyId: string): Promise<BlackjackGame | null> {
    return await this.dataSource.transaction(async (manager) => {
      const lobby = await manager.getRepository(Lobby).findOne({
        where: { id: lobbyId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lobby || lobby.status !== LobbyState.ACTIVE) {
        return null;
      }

      let game = await manager.getRepository(BlackjackGame).findOne({
        where: { lobby: { id: lobbyId }, isCurrent: true },
        relations: ['lobby', 'lobby.owner', 'players', 'players.bets', 'players.user', 'players.hands'],
      });

      if (game) {
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
        if (game.status === BlackjackGameStatus.FINISHED && game.updatedAt < thirtySecondsAgo) {
          await this.blackjackGameRepository.update({ id: game.id }, { isCurrent: false });
        } else {
          return game;
        }
      }

      if (await this.maintenanceService.isInMaintenance([MaintenanceType.PAUSE, MaintenanceType.PAUSE_BLACKJACK])) {
        return null;
      }

      const newGame = manager.getRepository(BlackjackGame).create({
        isCurrent: true,
        lobby: { id: lobbyId },
        status: BlackjackGameStatus.WAITING_PLAYERS,
        fullDeck: [],
        deck: [],
        numOfDecks: this.configService.getBlackjackNumOfDecks(),
        dealerHand: [],
        currentPlayerId: '',
        dealerHandTotal: 0,
        players: [],
        serverSeed: getRandomString(128),
      });

      try {
        game = await manager.getRepository(BlackjackGame).save(newGame);
      } catch (err) {
        if (err instanceof QueryFailedError) {
          const pgError = err.driverError as { code?: string };

          if (pgError.code === '23505') {
            game = await manager.getRepository(BlackjackGame).findOne({
              where: { lobby: { id: lobbyId }, isCurrent: true },
              relations: ['lobby', 'lobby.owner', 'players', 'players.bets', 'players.user', 'players.hands'],
            });
            return game;
          }
        }

        throw err;
      }

      return manager.getRepository(BlackjackGame).findOne({
        where: { lobby: { id: lobbyId }, isCurrent: true },
        relations: ['lobby', 'lobby.owner', 'players', 'players.bets', 'players.user', 'players.hands'],
      });
    });
  }

  async doubleBetsControl(userId: string, lobbyId: string): Promise<void> {
    const game = await this.createOrGetActiveGame(lobbyId);

    if (!game) {
      throw new ServiceError('No game found');
    }

    if (game.lobby.status !== LobbyState.ACTIVE) {
      throw new ServiceError('Lobby is not active');
    }

    if (game.status !== BlackjackGameStatus.WAITING_BETS && game.status !== BlackjackGameStatus.COUNTDOWN) {
      throw new ServiceError('Betting is not available at the moment');
    }

    const player = game.players?.find((p) => p.userId === userId);

    if (!player) {
      throw new ServiceError('Player not found');
    }

    await this.dataSource.transaction(async (manager) => {
      const betRepo = manager.getRepository(BlackjackBet);

      const lastBet = await betRepo.findOne({
        where: { player: { id: player.id } },
        order: { version: 'DESC' },
      });
      if (!lastBet) return;

      const allBets = await betRepo.find({ where: { player: { id: player.id } } });
      const sumByPlace = (place: BlackjackBetPlace) =>
        allBets.filter((b) => b.betPlace === place && !b.insurance).reduce((sum, b) => sum + b.amount, 0);

      const betsMainAmount = sumByPlace(BlackjackBetPlace.MAIN);
      const betsSide21_3Amount = sumByPlace(BlackjackBetPlace.SIDE21_3);
      const betsPerfectPairAmount = sumByPlace(BlackjackBetPlace.PERFECT_PAIR);

      const totalPlayerBets = betsMainAmount + betsSide21_3Amount + betsPerfectPairAmount;

      if (totalPlayerBets * 2 > game.lobby.maxBet) {
        throw new ServiceError(`Total max bet for the hand is $${game.lobby.maxBet}`);
      }

      const nextVersion = lastBet.version + 1;
      const newBets: BlackjackBet[] = [];

      const queueDouble = (place: BlackjackBetPlace, currentAmount: number, reason: string) => {
        if (currentAmount <= 0) return;
        newBets.push(
          betRepo.create({
            amount: currentAmount,
            betPlace: place,
            player: { id: player.id },
            user: { id: player.userId },
            version: nextVersion,
          }),
        );
        // Each double-bet add is its own balance debit (with its own log) but
        // happens within the same transaction — so it's all-or-nothing.
        return reason;
      };

      const additions: Array<{ place: BlackjackBetPlace; amount: number; reason: string }> = [];
      if (betsMainAmount > 0)
        additions.push({ place: BlackjackBetPlace.MAIN, amount: betsMainAmount, reason: 'Double down - MAIN BET' });
      if (betsSide21_3Amount > 0)
        additions.push({
          place: BlackjackBetPlace.SIDE21_3,
          amount: betsSide21_3Amount,
          reason: 'Double down - SIDE21_3',
        });
      if (betsPerfectPairAmount > 0)
        additions.push({
          place: BlackjackBetPlace.PERFECT_PAIR,
          amount: betsPerfectPairAmount,
          reason: 'Double down - PERFECT_PAIR',
        });

      for (const a of additions) {
        queueDouble(a.place, a.amount, a.reason);
        await this.userService.updateBalance(player.userId, -a.amount, manager, {
          logType: BalanceLogType.BET_PLACED,
          gameId: game.id,
          gameType: 'blackjack',
          playerId: player.id,
          lobbyId: game.lobbyId,
          reason: a.reason,
        });
      }

      if (newBets.length > 0) {
        await betRepo.save(newBets);
      }

      const updatedBets = await betRepo.find({ where: { player: { id: player.id } } });
      this.dispatcher.emitPlayerBet(lobbyId, player.id, updatedBets);
    });
  }

  async rebet(userId: string, lobbyId: string): Promise<{ shouldStartCountdown: boolean; hasNoPreviousBets: boolean }> {
    return await this.dataSource.transaction(async (manager) => {
      const game = await manager.findOne(BlackjackGame, {
        where: { lobby: { id: lobbyId }, isCurrent: true },
        relations: ['lobby', 'lobby.owner', 'players', 'players.bets', 'players.user', 'players.hands'],
      });

      if (!game) throw new ServiceError('No active game found for this lobby');

      if (game.lobby.ownerId === userId) {
        throw new ServiceError('You cannot place bets in your own lobby');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== BlackjackGameStatus.WAITING_BETS && game.status !== BlackjackGameStatus.COUNTDOWN) {
        throw new ServiceError('Betting is not available at the moment');
      }

      let player = await manager.findOne(BlackjackPlayer, {
        where: { user: { id: userId }, game: { lobby: { id: lobbyId }, isCurrent: true } },
        relations: ['bets', 'user'],
      });

      if (!player) {
        throw new ServiceError("You didn't join the game.");
      }

      const previousGame = await manager.findOne(BlackjackGame, {
        where: { lobby: { id: lobbyId }, status: BlackjackGameStatus.FINISHED },
        order: { updatedAt: 'DESC' },
        relations: ['players', 'players.hands'],
      });

      if (!previousGame) return { shouldStartCountdown: false, hasNoPreviousBets: true };

      const previousGamePlayer = previousGame.players.find((p) => p.userId === userId);
      if (!previousGamePlayer) return { shouldStartCountdown: false, hasNoPreviousBets: true };

      const [betsMain, betsSide21_3, betsPerfectPair] = await Promise.all([
        manager.find(BlackjackBet, {
          where: { player: { id: previousGamePlayer.id }, betPlace: BlackjackBetPlace.MAIN, insurance: false },
        }),
        manager.find(BlackjackBet, {
          where: { player: { id: previousGamePlayer.id }, betPlace: BlackjackBetPlace.SIDE21_3 },
        }),
        manager.find(BlackjackBet, {
          where: { player: { id: previousGamePlayer.id }, betPlace: BlackjackBetPlace.PERFECT_PAIR },
        }),
      ]);

      const betsMainAmount = betsMain.reduce((sum, b) => sum + b.amount, 0);
      const betsSide21_3Amount = betsSide21_3.reduce((sum, b) => sum + b.amount, 0);
      const betsPerfectPairAmount = betsPerfectPair.reduce((sum, b) => sum + b.amount, 0);

      let previousBetFunctions = 1;
      if (previousGamePlayer.hands[0]) {
        if (previousGamePlayer.hands[0].hasDoubled) previousBetFunctions++;
        if (previousGamePlayer.hands[0].hasSplitted) previousBetFunctions++;
      }
      if (previousGamePlayer.hands[1]?.hasDoubled) previousBetFunctions++;

      const totalMainBet = betsMainAmount / previousBetFunctions;
      const totalBet = totalMainBet + betsSide21_3Amount + betsPerfectPairAmount;

      if (totalBet > game.lobby.maxBet) {
        throw new ServiceError(`Total max bet for the hand is $${game.lobby.maxBet}`);
      }

      if (totalBet > player.user.balance) {
        throw new ServiceError('Insufficient balance to rebet.');
      }

      await this.refundExistingBets(manager, player, game, 'Bet refunded for re-bet');

      const betsToCreate: Array<{ amount: number; betPlace: BlackjackBetPlace }> = [];

      if (betsMain.length > 0) {
        betsToCreate.push({ amount: totalMainBet, betPlace: BlackjackBetPlace.MAIN });
      }

      if (betsSide21_3.length > 0) {
        betsToCreate.push({ amount: betsSide21_3Amount, betPlace: BlackjackBetPlace.SIDE21_3 });
      }

      if (betsPerfectPair.length > 0) {
        betsToCreate.push({ amount: betsPerfectPairAmount, betPlace: BlackjackBetPlace.PERFECT_PAIR });
      }

      player = await manager.findOne(BlackjackPlayer, {
        where: { user: { id: userId }, game: { lobby: { id: lobbyId }, isCurrent: true } },
        relations: ['bets', 'user'],
      });

      if (!player) {
        throw new ServiceError("You didn't join the game.");
      }

      const { shouldStartCountdown } = await this.processBetOperation(manager, game, player, betsToCreate);

      return { shouldStartCountdown, hasNoPreviousBets: false };
    });
  }

  async undoBets(userId: string, lobbyId: string): Promise<void> {
    const game = await this.createOrGetActiveGame(lobbyId);

    if (!game) {
      throw new ServiceError('No game found');
    }

    if (game.lobby.status !== LobbyState.ACTIVE) {
      throw new ServiceError('Lobby is not active');
    }

    if (game.status !== BlackjackGameStatus.WAITING_BETS && game.status !== BlackjackGameStatus.COUNTDOWN) {
      throw new ServiceError('Betting is not available at the moment');
    }

    const player = game.players?.find((p) => p.userId === userId);

    if (!player) {
      throw new ServiceError('Player not found');
    }

    await this.dataSource.transaction(async (manager) => {
      const betRepo = manager.getRepository(BlackjackBet);
      const lastBet = await betRepo.findOne({
        where: { player: { id: player.id } },
        order: { version: 'DESC' },
      });
      if (!lastBet) return;

      const lastBets = await betRepo.find({
        where: { player: { id: player.id }, version: lastBet.version },
      });
      if (lastBets.length === 0) return;

      const undoAmount = lastBets.reduce((sum, bet) => sum + bet.amount, 0);

      await betRepo.remove(lastBets);
      await this.userService.updateBalance(player.userId, undoAmount, manager, {
        logType: BalanceLogType.GAME_PAYOUT,
        gameId: game.id,
        gameType: 'blackjack',
        playerId: player.id,
        lobbyId: game.lobbyId,
        reason: `Bet refunded - undo`,
      });

      const updatedBets = await betRepo.find({ where: { player: { id: player.id } } });
      this.dispatcher.emitPlayerBet(lobbyId, player.id, updatedBets);
    });

    // Check if any players still have bets (outside the transaction so the
    // socket emits and game-state save reflect the committed state).
    const updatedGame = await this.blackjackGameRepository.findOne({
      where: { id: game.id },
      relations: ['players', 'players.bets'],
    });

    if (!updatedGame) return;

    const hasAnyBets = updatedGame.players?.some((p) => p.bets?.length > 0);

    if (!hasAnyBets && updatedGame.status === BlackjackGameStatus.COUNTDOWN) {
      this.blackjackManager.cancelGameStart(updatedGame.lobbyId);
      updatedGame.status = BlackjackGameStatus.WAITING_BETS;
      await this.blackjackGameRepository.save(updatedGame);
      this.dispatcher.emitBlackjackStatusUpdate(lobbyId, BlackjackGameStatus.WAITING_BETS);
    }
  }

  async clearAllBets(userId: string, lobbyId: string): Promise<void> {
    const game = await this.createOrGetActiveGame(lobbyId);

    if (!game) {
      throw new ServiceError('No game found');
    }

    if (game.lobby.status !== LobbyState.ACTIVE) {
      throw new ServiceError('Lobby is not active');
    }

    if (game.status !== BlackjackGameStatus.WAITING_BETS && game.status !== BlackjackGameStatus.COUNTDOWN) {
      throw new ServiceError('Betting is not available at the moment');
    }

    const player = game.players?.find((p) => p.userId === userId);

    if (!player) {
      throw new ServiceError('Player not found');
    }

    await this.dataSource.transaction(async (manager) => {
      const betRepo = manager.getRepository(BlackjackBet);
      const allBets = await betRepo.find({ where: { player: { id: player.id } } });
      const betsAmount = allBets.reduce((sum, bet) => sum + bet.amount, 0);

      if (allBets.length > 0) {
        await betRepo.remove(allBets);
      }

      if (betsAmount > 0) {
        await this.userService.updateBalance(player.userId, betsAmount, manager, {
          logType: BalanceLogType.GAME_PAYOUT,
          lobbyId,
          gameType: 'blackjack',
          gameId: player.gameId,
          playerId: player.id,
          reason: `Bet refunded - clear all`,
        });
      }

      this.dispatcher.emitPlayerBet(lobbyId, player.id, []);
    });

    // Check if any players still have bets
    const updatedGame = await this.blackjackGameRepository.findOne({
      where: { id: game.id },
      relations: ['players', 'players.bets'],
    });

    if (!updatedGame) return;

    const hasAnyBets = updatedGame.players?.some((p) => p.bets?.length > 0);

    if (!hasAnyBets && updatedGame.status === BlackjackGameStatus.COUNTDOWN) {
      this.blackjackManager.cancelGameStart(lobbyId);
      updatedGame.status = BlackjackGameStatus.WAITING_BETS;
      await this.blackjackGameRepository.save(updatedGame);
      this.dispatcher.emitBlackjackStatusUpdate(lobbyId, BlackjackGameStatus.WAITING_BETS);
    }
  }

  async resolvePlayerInsurance(game: BlackjackGame, player: BlackjackPlayer, insured: boolean) {
    if (insured) {
      const betInsurance = player.bets
        .filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN)
        .reduce((sum, bet) => sum + bet.amount, 0);
      const insuranceAmount = betInsurance / 2;

      await this.dataSource.transaction(async (manager) => {
        const newBet = manager.getRepository(BlackjackBet).create({
          amount: insuranceAmount,
          betPlace: BlackjackBetPlace.MAIN,
          insurance: true,
          version: Math.max(...player.bets.map((bet) => bet.version)) + 1,
          wonAmount: 0,
          player: { id: player.id },
          user: { id: player.userId },
          hand: { id: player.hands[0].id },
        });

        await manager.getRepository(BlackjackPlayer).update({ id: player.id }, { insured: true });
        await manager.getRepository(BlackjackBet).save(newBet);
        await this.userService.updateBalance(player.userId, -insuranceAmount, manager, {
          logType: BalanceLogType.BET_PLACED,
          gameId: game.id,
          gameType: 'blackjack',
          playerId: player.id,
          lobbyId: game.lobbyId,
          reason: `Insurance bet`,
        });
      });

      player.insured = true;
    }

    this.blackjackManager.trackInsuranceResponse(game.id, player.id);

    const allDone = this.haveAllPlayersResponded(
      game.id,
      game.players.map((p) => p.id),
    );

    if (allDone) {
      await this.blackjackManager.cancelInsuranceTimer(game.lobbyId);
      this.blackjackManager.clearInsuranceResponses(game.id);

      await this.blackjackManager.processGameState(game.lobbyId);
    }
  }

  async resolvePlayerDealNow(game: BlackjackGame, player: BlackjackPlayer): Promise<void> {
    this.blackjackManager.trackDealNowResponse(game.lobbyId, player.id);

    const allDone = this.haveAllPlayersRespondedDealNow(
      game.lobbyId,
      game.players.map((p) => p.id),
    );

    if (allDone) {
      await this.blackjackManager.cancelDealNowTimer(game.lobbyId);
      this.blackjackManager.clearDealNowResponses(game.lobbyId);
    }
  }

  haveAllPlayersRespondedDealNow(lobbyId: string, playerIds: string[]): boolean {
    const respondedSet = this.blackjackManager.getDealNowResponses(lobbyId);

    if (!respondedSet) return false;

    return playerIds.every((id) => respondedSet.has(id));
  }

  haveAllPlayersResponded(gameId: string, playerIds: string[]): boolean {
    const respondedSet = this.blackjackManager.getInsuranceResponses(gameId);

    if (!respondedSet) return false;

    return playerIds.every((id) => respondedSet.has(id));
  }

  checkGameInsuranceValid(gameId: string, playerId: string): boolean {
    return !this.blackjackManager.hasPlayerRespondedToInsurance(gameId, playerId);
  }

  async prepareNextGame(game: BlackjackGame, previousGame: BlackjackGame): Promise<void> {
    for (const player of previousGame.players.sort((a, b) => a.seatIndex - b.seatIndex)) {
      const existingPlayer = game.players.find((p) => p.userId === player.userId && p.seatIndex === player.seatIndex);

      if (!existingPlayer) {
        const newPlayer = await this.blackjackPlayerService.createPlayer(player.userId, game.id, player.seatIndex);
        game.players.push(newPlayer);
      }
    }

    if (game.players.length > 0) {
      game.status = BlackjackGameStatus.WAITING_BETS;
      game.currentPlayerId = '';
    }
    game.deck = [];
    game.fullDeck = [];
    game.dealerHand = [];

    await this.blackjackGameRepository.save(game);

    await this.getCurrentGameAndEmit(game.lobbyId);
  }

  async placeBet(userId: string, data: BlackjackBetDto): Promise<{ shouldStartCountdown: boolean }> {
    return await this.dataSource.transaction(async (manager) => {
      const game = await manager.findOne(BlackjackGame, {
        where: { lobby: { id: data.lobbyId }, isCurrent: true },
        relations: ['lobby', 'lobby.owner', 'players', 'players.bets', 'players.user', 'players.hands'],
      });

      if (!game) throw new ServiceError('No active game found for this lobby');

      if (game.lobby.ownerId === userId) {
        throw new ServiceError('You cannot place bets in your own lobby');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== BlackjackGameStatus.WAITING_BETS && game.status !== BlackjackGameStatus.COUNTDOWN) {
        throw new ServiceError('Betting is not available at the moment');
      }

      let player = await manager.findOne(BlackjackPlayer, {
        where: { user: { id: userId }, game: { lobby: { id: data.lobbyId }, isCurrent: true } },
        relations: ['bets'],
      });

      if (!player) {
        throw new ServiceError("You didn't join the game.");
      }

      const hasMainBet = player.bets.some((bet) => bet.betPlace === BlackjackBetPlace.MAIN);
      if (!hasMainBet && data.betPlace !== BlackjackBetPlace.MAIN) {
        throw new ServiceError('Place a main bet before side bets');
      }

      const playerBetAmount = player.bets?.reduce((sum, bet) => sum + bet.amount, 0);
      const totalBetAmount = playerBetAmount + data.amount;

      if (totalBetAmount > game.lobby.maxBet) {
        throw new ServiceError(`Total max bet for the hand is $${game.lobby.maxBet}`);
      }

      player = await manager.findOne(BlackjackPlayer, {
        where: { user: { id: userId }, game: { lobby: { id: data.lobbyId }, isCurrent: true } },
        relations: ['bets'],
      });

      if (!player) {
        throw new ServiceError("You didn't join the game.");
      }

      const { shouldStartCountdown } = await this.processBetOperation(manager, game, player, [
        { amount: data.amount, betPlace: data.betPlace },
      ]);

      return { shouldStartCountdown };
    });
  }

  private async processBetOperation(
    manager: EntityManager,
    game: BlackjackGame,
    player: BlackjackPlayer,
    betsToCreate: Array<{ amount: number; betPlace: BlackjackBetPlace }>,
  ): Promise<{ shouldStartCountdown: boolean }> {
    const totalBetAmount = betsToCreate.reduce((sum, bet) => sum + bet.amount, 0);

    const lastBet = await manager.findOne(BlackjackBet, {
      where: { player: { id: player.id } },
      order: { version: 'DESC' },
    });

    const nextVersion = lastBet ? lastBet.version + 1 : 0;

    await this.userService.updateBalance(player.userId, -totalBetAmount, manager, {
      logType: BalanceLogType.BET_PLACED,
      gameId: game.id,
      gameType: 'blackjack',
      playerId: player.id,
      lobbyId: game.lobbyId,
      reason: `Placed bets`,
    });

    const newBets = betsToCreate.map((betData) =>
      manager.create(BlackjackBet, {
        amount: betData.amount,
        wonAmount: 0,
        betPlace: betData.betPlace,
        version: nextVersion,
        player: { id: player.id },
        user: { id: player.userId },
      }),
    );

    await manager.save(BlackjackBet, newBets);

    const gamePlayers = await manager.find(BlackjackPlayer, {
      where: { game: { id: game.id } },
      relations: ['user', 'bets', 'hands'],
    });

    const maxWinTableNotice = this.calculateGroupedBets(gamePlayers, game.lobby.bankroll);

    if (maxWinTableNotice) {
      this.dispatcher.emitBlackjackMaxWinNotice(game.lobbyId, player.userId, game.id);
    }

    this.dispatcher.emitPlayerBet(game.lobbyId, player.id, [...player.bets, ...newBets]);

    const shouldStartCountdown = game.status === BlackjackGameStatus.WAITING_BETS;

    if (shouldStartCountdown) {
      const deadline = new Date(Date.now() + 10 * 1000);
      await manager.update(BlackjackGame, game.id, {
        status: BlackjackGameStatus.COUNTDOWN,
        timerDeadline: deadline,
        timerType: 'countdown',
      });
    }

    return { shouldStartCountdown };
  }

  private async refundExistingBets(
    manager: EntityManager,
    player: BlackjackPlayer,
    game: BlackjackGame,
    reason: string,
  ): Promise<void> {
    const existingBets = await manager.find(BlackjackBet, {
      where: { player: { id: player.id } },
    });

    if (existingBets.length > 0) {
      const refundAmount = existingBets.reduce((sum: number, bet: BlackjackBet) => sum + bet.amount, 0);

      await this.userService.updateBalance(player.userId, refundAmount, manager, {
        logType: BalanceLogType.GAME_PAYOUT,
        gameId: game.id,
        gameType: 'blackjack',
        playerId: player.id,
        lobbyId: game.lobbyId,
        reason,
      });

      await manager.remove(BlackjackBet, existingBets);
    }
  }

  async setGameFairnessDeck(game: BlackjackGame): Promise<BlackjackGame> {
    let fairnessRandom: string;

    try {
      fairnessRandom = await this.randomOrgService.getRandomString();
    } catch (err) {
      Logger.error(`Blackjack ${game.lobbyId} - Failed to fetch randomness from Random.org: ${err}`, 'Blackjack');
      throw new ServiceError('Failed to fetch randomness from Random.org');
    }

    const deck = this.generateShuffledDeck(game.serverSeed, fairnessRandom, game.numOfDecks);

    Logger.log(`Blackjack ${game.lobbyId} - Deck successfully generated with no duplicates.`, 'Blackjack');

    game.deck = deck;
    game.fullDeck = this.generateShuffledDeck(game.serverSeed, fairnessRandom, game.numOfDecks);
    game.fairnessRandom = fairnessRandom;
    await this.blackjackGameRepository.save(game);

    return game;
  }

  async startGame(gameId: string) {
    const updateResult = await this.blackjackGameRepository
      .createQueryBuilder()
      .update(BlackjackGame)
      .set({ status: BlackjackGameStatus.DEALING, timerDeadline: null, timerType: null })
      .where('id = :gameId', { gameId })
      .andWhere('status = :currentStatus', { currentStatus: BlackjackGameStatus.COUNTDOWN })
      .execute();

    if (updateResult.affected === 0) {
      return;
    }

    let game = await this.blackjackGameRepository.findOne({
      where: { id: gameId },
      relations: ['lobby', 'lobby.owner', 'players', 'players.user', 'players.bets', 'players.hands'],
    });

    if (!game) return;

    await this.blackjackManager.cancelDealNowTimer(game.lobbyId);
    this.blackjackManager.clearDealNowResponses(game.lobbyId);
    this.dispatcher.emitBlackjackStatusUpdate(game.lobbyId, BlackjackGameStatus.DEALING);

    game = await this.setGameFairnessDeck(game);

    if (!game) return;

    const playerHands = await this.validatePlayers(game);

    game = await this.getActiveGame(game.lobbyId);
    if (!game) return;

    if (playerHands?.length <= 0) {
      this.blackjackManager.cancelGameStart(game.lobbyId);
      await this.blackjackGameRepository.update({ id: game.id }, { deck: [], fairnessRandom: undefined });
      if (game.lobby.status !== LobbyState.ACTIVE) {
        await this.blackjackGameRepository.delete({ id: game.id });
        this.dispatcher.emitLobbyActiveStatusChange(game.lobbyId, game.lobby.code, game.lobby.status);
      }
      return;
    }

    const dealerCard2 = this.drawCard(game);
    game.dealerHand.push(dealerCard2);
    game.dealerHandTotal = this.calculateHandValue([game.dealerHand[0]]);

    await this.blackjackGameRepository.save(game);

    const dealingEvents: DealingEvent[] = [];

    for (const { playerId, hand } of playerHands) {
      dealingEvents.push({
        recipient: playerId,
        hand: { ...hand, handTotal: this.calculateHandValue([hand.hand[0]]), hand: [hand.hand[0]] },
      });
    }

    dealingEvents.push({
      recipient: 'dealer',
      hand: { handTotal: this.calculateHandValue([game.dealerHand[0]]), hand: [game.dealerHand[0]] },
    });

    for (const { playerId, hand } of playerHands) {
      dealingEvents.push({
        recipient: playerId,
        hand: {
          ...hand,
          handTotal: this.calculateHandValue([hand.hand[0], hand.hand[1]]),
          hand: [hand.hand[0], hand.hand[1]],
        },
      });
    }
    await this.blackjackScheduler.scheduleDealingSequence(game, dealingEvents, 800);

    await this.resolveSideBets(game);
    await this.resolvePlayerStartingBets(game);

    game = await this.getActiveGame(game.lobbyId);
    if (!game) return;

    const currentPlayer = await this.blackjackPlayerService.getCurrentPlaying(game.players);
    const currentPlayerId = currentPlayer?.userId ?? '';

    const updateResultPlaying = await this.blackjackGameRepository
      .createQueryBuilder()
      .update(BlackjackGame)
      .set({ status: BlackjackGameStatus.PLAYING, currentPlayerId })
      .where('id = :gameId', { gameId })
      .andWhere('status = :currentStatus', { currentStatus: BlackjackGameStatus.DEALING })
      .execute();

    if (updateResultPlaying.affected === 0) {
      return;
    }

    game = await this.getActiveGame(game.lobbyId);
    if (!game) return;

    this.dispatcher.emitBlackjackStatusUpdate(game.lobbyId, BlackjackGameStatus.PLAYING);

    if (game.dealerHand[0].startsWith('A') && game.status === BlackjackGameStatus.PLAYING) {
      const deadline = new Date(Date.now() + 10 * 1000);
      game.timerDeadline = deadline;
      game.timerType = 'insurance';
      await this.save(game);

      this.blackjackManager.startInsuranceTimer(game.lobbyId, game.id, 10);
      this.dispatcher.emitInsuranceTurn(game.lobbyId, deadline);
      return;
    }

    this.blackjackManager.scheduleStateTransition(game.lobbyId, 200);
  }

  async validatePlayers(game: BlackjackGame): Promise<{ playerId: string; hand: BlackjackHandDTO }[]> {
    const playerHands: { playerId: string; hand: BlackjackHandDTO }[] = [];

    const playersList = game.players.sort((a, b) => a.seatIndex - b.seatIndex);

    // Deal every player first card
    for (const player of playersList) {
      const totalPlayerBet = player.bets.reduce((sum, bet) => sum + bet.amount, 0);

      const isValid =
        player.bets.some((bet) => bet.betPlace === BlackjackBetPlace.MAIN) && totalPlayerBet >= game.lobby.minBet;

      if (!isValid) {
        await this.leaveGame(player.userId, game.lobbyId, `You need to place a minimum bet of $${game.lobby.minBet}`);
        continue;
      }

      this.blackjackManager.resetInactivityTimer(game.lobbyId, player.userId);

      const card1 = this.drawCard(game);

      const playerHand = this.blackjackHandRepository.create({
        hand: [card1],
        handTotal: this.calculateHandValue([card1]),
        hasStood: false,
        isBusted: false,
        hasDoubled: false,
        hasSplitted: false,
        isDoubledRevealed: true,
        payoutResult: null,
        handIndex: 0,
        player: { id: player.id },
        user: { id: player.userId },
      });

      await this.blackjackHandRepository.save(playerHand);
      player.hands.push(playerHand);
    }

    const currentGame = await this.getActiveGame(game.lobbyId);
    if (!currentGame || currentGame?.players.length <= 0) return playerHands;

    game.dealerHand.push(this.drawCard(game));

    // Deal every player second card
    for (const player of playersList) {
      const totalPlayerBet = player.bets.reduce((sum, bet) => sum + bet.amount, 0);
      const isValid =
        player.bets.some((bet) => bet.betPlace === BlackjackBetPlace.MAIN) && totalPlayerBet >= game.lobby.minBet;

      if (!isValid) {
        continue;
      }
      const card2 = this.drawCard(game);

      player.hands[0].hand.push(card2);
      player.hands[0].handTotal = this.calculateHandValue(player.hands[0].hand);
      player.hands[0].hasStood = player.hands[0]?.handTotal === 21;

      await this.blackjackHandRepository.save(player.hands[0]);

      player.currentHandId = player.hands[0].id;

      await this.blackjackBetRepository.update(
        { id: In(player.bets.filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN).map((bet) => bet.id)) },
        { hand: { id: player.hands[0].id } },
      );

      await this.blackjackPlayerService.update(player.id, {
        currentHandId: player.currentHandId,
      });

      playerHands.push({ playerId: player.id, hand: new BlackjackHandDTO(player.hands[0]) });
    }

    await this.blackjackGameRepository.update(
      { id: game.id },
      {
        deck: game.deck,
        dealerHand: game.dealerHand,
        ...(playerHands.length === 0 && { status: BlackjackGameStatus.WAITING_PLAYERS }),
      },
    );

    return playerHands;
  }

  async resolveSideBets(game: BlackjackGame): Promise<void> {
    const dealerCard = game.dealerHand[0];
    const updatedBets: BlackjackBet[] = [];

    for (const player of game.players) {
      if (!player.hands[0]) continue;
      const [card1, card2] = player.hands[0].hand;

      const sidePerfectPairBets = player.bets.filter((bet) => bet.betPlace === BlackjackBetPlace.PERFECT_PAIR);
      const side21_3Bets = player.bets.filter((bet) => bet.betPlace === BlackjackBetPlace.SIDE21_3);

      if (sidePerfectPairBets?.length > 0) {
        const payoutMultiplier = this.getPerfectPairPayout(card1, card2);

        for (const bet of sidePerfectPairBets) {
          bet.wonAmount = this.handleBetPayout(bet, game.lobby, payoutMultiplier);
          bet.profitAmount = bet.wonAmount - bet.amount;
        }

        updatedBets.push(...sidePerfectPairBets);
      }

      if (side21_3Bets?.length > 0) {
        const payoutMultiplier = this.get21Plus3Payout(card1, card2, dealerCard);

        for (const bet of side21_3Bets) {
          bet.wonAmount = this.handleBetPayout(bet, game.lobby, payoutMultiplier);
          bet.profitAmount = bet.wonAmount - bet.amount;
        }
        updatedBets.push(...side21_3Bets);
      }
    }

    // Note: side-bet bankroll deduction and any cap-and-scale happens in
    // resolvePlayerStartingBets so that side bets and natural-BJ main bets are
    // capped together against the remaining bankroll.
    if (updatedBets?.length > 0) {
      await this.blackjackBetRepository.save(updatedBets);
    }
  }

  handleBetPayout(bet: BlackjackBet, _lobby: Lobby, multiplier: number) {
    return bet.amount * multiplier;
  }

  handleLobbyProportionalPayout(bets: BlackjackBet[], bankroll: number, totalExpected: number): BlackjackBet[] {
    if (bankroll <= 0) {
      for (const bet of bets) {
        bet.wonAmount = bet.amount;
        bet.profitAmount = 0;
      }
      return bets;
    }

    return bets.map((bet) => {
      bet.wonAmount = (bankroll / totalExpected) * bet.wonAmount + bet.amount;
      bet.profitAmount = bet.wonAmount - bet.amount;
      return bet;
    });
  }

  /**
   * Caps winning bets so cumulative payout cannot exceed lobby bankroll
   * (plus the stakes from losing bets that the lobby gains in the same phase).
   * Mutates winning bets' wonAmount/profitAmount in place.
   * Returns the signed net profit owed by the lobby — positive = bankroll
   * decreases, negative = bankroll increases.
   */
  capWinningBetsToBankroll(bets: BlackjackBet[], bankroll: number): { netLobbyProfit: number } {
    if (bets.length === 0) return { netLobbyProfit: 0 };

    const winning = bets.filter((b) => b.profitAmount > 0);
    const losing = bets.filter((b) => b.profitAmount < 0);

    // Stakes from losing bets become available to pay winners in this phase.
    const lossesToLobby = losing.reduce((sum, b) => sum - b.profitAmount, 0);

    if (winning.length > 0) {
      const totalGrossWin = winning.reduce((sum, b) => sum + b.wonAmount, 0);
      const totalProfitWin = winning.reduce((sum, b) => sum + b.profitAmount, 0);
      const effectivePool = bankroll + lossesToLobby;

      if (totalProfitWin > effectivePool) {
        this.handleLobbyProportionalPayout(winning, effectivePool, totalGrossWin);
      }
    }

    const netLobbyProfit = bets.reduce((sum, b) => sum + b.profitAmount, 0);
    return { netLobbyProfit };
  }

  async resolvePlayerStartingBets(game: BlackjackGame): Promise<void> {
    const dealerCard = game.dealerHand[0];
    const dealerHasFaceCard = ['10', 'J', 'Q', 'K', 'A'].includes(dealerCard?.slice(0, -1));

    // Set wonAmount/profitAmount on natural-BJ main bets (uncapped — capping happens below).
    const blackjackMainBets: BlackjackBet[] = [];
    for (const player of game.players) {
      const playerMainBets = player.bets.filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN);
      if (playerMainBets.length < 1) continue;
      for (const hand of player.hands) {
        const userHasBlackjack = hand?.handTotal === 21 && hand?.hand?.length === 2;
        if (userHasBlackjack && !dealerHasFaceCard) {
          for (const bet of playerMainBets) {
            bet.wonAmount = this.handleBetPayout(bet, game.lobby, 2.5);
            bet.profitAmount = bet.wonAmount - bet.amount;
          }
          blackjackMainBets.push(...playerMainBets);
        }
      }
    }

    // Side bets were already given wonAmount/profitAmount in resolveSideBets but
    // their bankroll cost has not yet been subtracted from the lobby. Cap them
    // jointly with the natural-BJ main bets against the current bankroll.
    const sideBetsAcrossPlayers: BlackjackBet[] = [];
    for (const player of game.players) {
      sideBetsAcrossPlayers.push(
        ...player.bets.filter(
          (bet) => bet.betPlace === BlackjackBetPlace.SIDE21_3 || bet.betPlace === BlackjackBetPlace.PERFECT_PAIR,
        ),
      );
    }

    const phase2Bets = [...blackjackMainBets, ...sideBetsAcrossPlayers];
    const { netLobbyProfit } = this.capWinningBetsToBankroll(phase2Bets, game.lobby.bankroll);

    const phase2BetSum = phase2Bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (netLobbyProfit !== 0) {
      await this.lobbyService.updateBankroll(game.lobbyId, -netLobbyProfit, undefined, {
        gameId: game.id,
        reason: 'Resolve starting bets (natural BJ + side bets)',
        logType: TransactionType.GAME_BET_RESULT,
      });
      await this.updateGameStats(game.lobbyId, game.id, phase2BetSum, -netLobbyProfit);
      // Reflect post-deduction bankroll so subsequent reads in this call see the cap.
      game.lobby.bankroll = Math.max(0, game.lobby.bankroll - netLobbyProfit);
    }

    if (phase2Bets.length > 0) {
      await this.blackjackBetRepository.save(phase2Bets);
    }

    const updatedGame = await this.getActiveGame(game.lobbyId);
    if (!updatedGame) return;

    for (const player of updatedGame.players) {
      const naturalBJ = player.hands[0]?.handTotal === 21 && player.hands[0]?.hand?.length === 2 && !dealerHasFaceCard;

      // Phase-2 payout = main BJ winnings (if natural BJ) + side bet winnings.
      const phase2Won = player.bets
        .filter((bet) => {
          if (bet.betPlace === BlackjackBetPlace.SIDE21_3 || bet.betPlace === BlackjackBetPlace.PERFECT_PAIR) {
            return true;
          }
          return naturalBJ && bet.betPlace === BlackjackBetPlace.MAIN && !bet.insurance;
        })
        .reduce((sum, bet) => sum + bet.wonAmount, 0);

      const phase2Profit = player.bets
        .filter((bet) => {
          if (bet.betPlace === BlackjackBetPlace.SIDE21_3 || bet.betPlace === BlackjackBetPlace.PERFECT_PAIR) {
            return true;
          }
          return naturalBJ && bet.betPlace === BlackjackBetPlace.MAIN && !bet.insurance;
        })
        .reduce((sum, bet) => sum + bet.profitAmount, 0);

      if (phase2Profit > 0) {
        await this.userService.updateBalance(player.userId, phase2Won, undefined, {
          logType: BalanceLogType.GAME_PAYOUT,
          gameId: game.id,
          gameType: 'blackjack',
          playerId: player.id,
          lobbyId: game.lobbyId,
          reason: naturalBJ ? 'Won blackjack + side bet payout' : 'Side bet payout',
        });
      }

      if (naturalBJ) {
        await this.blackjackPlayerService.update(player.id, { payedOut: true });
      }
    }

    await this.checkAndFinishRound(updatedGame.id);
    await this.getCurrentGameAndEmit(updatedGame.lobbyId);
  }

  getPerfectPairPayout(card1: string, card2: string): number {
    const card1Value = card1.slice(0, -1);
    const card1Suit = card1.slice(-1);
    const card2Value = card2.slice(0, -1);
    const card2Suit = card2.slice(-1);

    if (card1Value !== card2Value) return 0;

    const isSameSuit = card1Suit === card2Suit;
    if (isSameSuit) return 26;

    const isSameColor = (card1Suit === 'H' || card1Suit === 'D') === (card2Suit === 'H' || card2Suit === 'D');
    if (isSameColor) return 11;

    return 6;
  }

  get21Plus3Payout(card1: string, card2: string, dealerCard: string): number {
    const cards = [card1, card2, dealerCard];
    const suits = cards.map((c) => c.slice(-1));
    const values = cards.map((c) => this.mapFaceToNumber(c.slice(0, -1))).sort((a, b) => a - b);

    const allSameSuit = suits.every((s) => s === suits[0]);
    const isFlush = allSameSuit;
    const isStraight = values[2] - values[0] === 2 && new Set(values).size === 3;
    const isThreeOfAKind = new Set(values).size === 1;

    if (isThreeOfAKind) return 31;
    if (isStraight) return 11;
    if (isFlush) return 6;
    return 0;
  }

  mapFaceToNumber(value: string): number {
    const faceMap: Record<string, number> = { J: 11, Q: 12, K: 13, A: 1 };

    if (Object.prototype.hasOwnProperty.call(faceMap, value)) {
      return faceMap[value];
    }

    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 2 && parsed <= 10) {
      return parsed;
    }

    throw new Error(`Invalid card value: ${value}`);
  }

  async playerHit(userId: string, gameId: string): Promise<void> {
    const game = await this.blackjackGameRepository.findOne({ where: { id: gameId } });
    if (!game) throw new ServiceError('Active game not found');

    if (game.status !== BlackjackGameStatus.PLAYING) throw new ServiceError('Invalid game state.');

    const player = await this.blackjackPlayerService.getCurrentPlayer(userId, game.lobbyId);

    if (!player) throw new ServiceError('Player not found');

    if (!game.currentPlayerId || game.currentPlayerId !== player.userId)
      throw new ServiceError('Invalid player action.');

    const currentHand = await this.getCurrentPlayerHand(player.currentHandId);

    if (!currentHand) throw new Error('Player hand not found');

    if (currentHand.hasStood || currentHand.isBusted) return;

    this.blackjackManager.cancelPlayerTimer(gameId, player.userId);

    const card = this.drawCard(game);
    currentHand.hand.push(card);

    currentHand.handTotal = this.calculateHandValue(currentHand.hand);

    if (currentHand?.handTotal > 21) {
      currentHand.isBusted = true;
    }

    if (currentHand?.handTotal === 21) {
      currentHand.hasStood = true;
    }

    await this.blackjackHandRepository.save(currentHand);
    await this.blackjackGameRepository.update({ id: gameId }, { deck: game.deck });
    await this.getCurrentGameAndEmit(game.lobbyId);
    await this.blackjackScheduler.delay(500);
  }

  async playerStand(userId: string, game: BlackjackGame): Promise<void> {
    if (game.status !== BlackjackGameStatus.PLAYING) throw new ServiceError('Invalid game state.');

    const player = await this.blackjackPlayerService.getCurrentPlayer(userId, game.lobbyId);
    if (!player) return;

    if (!game.currentPlayerId || game.currentPlayerId !== player.userId)
      throw new ServiceError('Invalid player action.');

    const currentHand = await this.getCurrentPlayerHand(player.currentHandId);

    if (!currentHand) return;

    currentHand.hasStood = true;
    await this.blackjackHandRepository.save(currentHand);
  }

  async playerDoubleDown(userId: string, game: BlackjackGame): Promise<void> {
    if (game.status !== BlackjackGameStatus.PLAYING) throw new ServiceError('Invalid game state.');

    const user = await this.userService.findById(userId);
    if (!user) throw new ServiceError('User not found');

    const player = await this.blackjackPlayerService.getCurrentPlayer(userId, game.lobbyId, ['hands', 'bets']);
    if (!player) throw new ServiceError('Player not found');

    if (!game.currentPlayerId || game.currentPlayerId !== player.userId || player.userId !== user.id) {
      throw new ServiceError('Invalid player action');
    }

    if (player.hands?.some((hand) => hand.hasDoubled)) {
      throw new ServiceError('You can double once per hand.');
    }

    const mainBetAmount = player.bets
      .filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN && !bet.insurance)
      .reduce((sum, bet) => sum + bet.amount, 0);

    if (user.balance < mainBetAmount) {
      throw new ServiceError("Insufficient balance. You can't place the bet higher than your balance.");
    }

    const currentHand = await this.getCurrentPlayerHand(player.currentHandId);

    if (!currentHand) throw new ServiceError('Player hand not found');

    if (currentHand.hasSplitted) throw new ServiceError('You are not allowed to double down after the split.');

    this.blackjackManager.cancelPlayerTimer(game.id, player.userId);
    currentHand.hand.push(this.drawCard(game));
    currentHand.hasStood = true;
    currentHand.hasDoubled = true;
    currentHand.handTotal = this.calculateHandValue(currentHand.hand);
    currentHand.isBusted = currentHand.handTotal > 21;

    await this.doubleDownBets(player, currentHand);

    await this.blackjackHandRepository.save(currentHand);
    await this.blackjackGameRepository.save(game);
    await this.getCurrentGameAndEmit(game.lobbyId);
  }

  async doubleDownBets(player: BlackjackPlayer, hand: BlackjackHand): Promise<void> {
    const betAmount = player.bets
      .filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN && bet.handId === hand.id && !bet.insurance)
      .reduce((sum, bet) => sum + bet.amount, 0);

    if (betAmount <= 0) return;

    await this.dataSource.transaction(async (manager) => {
      const newBet = manager.getRepository(BlackjackBet).create({
        amount: betAmount,
        betPlace: BlackjackBetPlace.MAIN,
        version: Math.max(...player.bets.map((bet) => bet.version)) + 1,
        player: { id: player.id },
        user: { id: player.userId },
        hand: { id: hand.id },
      });

      await manager.getRepository(BlackjackBet).save(newBet);
      await this.userService.updateBalance(player.userId, -betAmount, manager, {
        logType: BalanceLogType.BET_PLACED,
        gameId: player.gameId,
        gameType: 'blackjack',
        playerId: player.id,
        reason: 'Double down bet',
      });
    });
  }

  async playerSplit(userId: string, game: BlackjackGame): Promise<void> {
    if (game.status !== BlackjackGameStatus.PLAYING) throw new ServiceError('Invalid game state.');

    const user = await this.userService.findById(userId);
    if (!user) throw new ServiceError('User not found');

    const player = await this.blackjackPlayerService.getCurrentPlayer(userId, game.lobbyId, ['hands', 'bets']);
    if (!player) throw new ServiceError('Player not found');

    if (!game.currentPlayerId || game.currentPlayerId !== player.userId || player.userId !== user.id) {
      throw new ServiceError('Invalid player action');
    }

    if (player.hands.length > 1) {
      throw new ServiceError('You can only split once per hand.');
    }

    const mainBetAmount = player.bets
      .filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN && !bet.insurance)
      .reduce((sum, bet) => sum + bet.amount, 0);

    if (user.balance < mainBetAmount) {
      throw new ServiceError("Insufficient balance. You can't place the bet higher than your balance.");
    }

    const currentHand = await this.getCurrentPlayerHand(player.currentHandId);

    if (!currentHand) throw new ServiceError('Player hand not found');

    this.blackjackManager.cancelPlayerTimer(game.id, player.userId);

    const cardForSplit = currentHand.hand.pop();

    if (!cardForSplit) {
      throw new ServiceError("Cards can't be splitted");
    }

    currentHand.handTotal = 0;
    currentHand.hasSplitted = true;
    await this.blackjackHandRepository.save([currentHand]);
    await this.getCurrentGameAndEmit(game.lobbyId);

    const splittedHand = this.blackjackHandRepository.create({
      hand: [cardForSplit],
      handTotal: 0,
      hasStood: false,
      isBusted: false,
      hasDoubled: false,
      hasSplitted: true,
      isDoubledRevealed: true,
      payoutResult: null,
      handIndex: 1,
      player: { id: player.id },
      user: { id: player.userId },
    });

    splittedHand.handTotal = this.calculateHandValue(splittedHand.hand);
    splittedHand.handIndex = 1;

    currentHand.handTotal = this.calculateHandValue(currentHand.hand);

    await this.blackjackHandRepository.save([currentHand, splittedHand]);
    await this.getCurrentGameAndEmit(game.lobbyId);

    await this.blackjackScheduler.delay(500);

    player.currentHandId = splittedHand.id;
    await this.blackjackPlayerService.updateCurrentHand(player.id, splittedHand.id);
    await this.getCurrentGameAndEmit(game.lobbyId);

    await this.doubleMainBets(player, splittedHand);
    await this.blackjackGameRepository.update({ id: game.id }, { deck: game.deck });
    await this.handleDealAfterSplit(splittedHand, currentHand, game);
  }

  async handleDealAfterSplit(splitHand: BlackjackHand, baseHand: BlackjackHand, game: BlackjackGame): Promise<void> {
    splitHand.hand.push(this.drawCard(game));
    splitHand.handTotal = this.calculateHandValue(splitHand.hand);
    splitHand.hasStood = splitHand?.handTotal === 21 || splitHand?.hand[0]?.startsWith('A');
    await this.blackjackHandRepository.save(splitHand);
    await this.getCurrentGameAndEmit(game.lobbyId);

    await this.blackjackScheduler.delay(1000);

    baseHand.hand.push(this.drawCard(game));
    baseHand.handTotal = this.calculateHandValue(baseHand.hand);
    baseHand.hasStood = baseHand?.handTotal === 21 || baseHand?.hand[0]?.startsWith('A');
    await this.blackjackHandRepository.save(baseHand);
    await this.getCurrentGameAndEmit(game.lobbyId);

    await this.blackjackGameRepository.update({ id: game.id }, { deck: game.deck });
  }

  async doubleMainBets(player: BlackjackPlayer, hand: BlackjackHand): Promise<void> {
    const betAmount = player.bets
      .filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN && !bet.insurance)
      .reduce((sum, bet) => sum + bet.amount, 0);

    if (betAmount <= 0) return;

    await this.dataSource.transaction(async (manager) => {
      const newBet = manager.getRepository(BlackjackBet).create({
        amount: betAmount,
        betPlace: BlackjackBetPlace.MAIN,
        version: Math.max(...player.bets.map((bet) => bet.version)) + 1,
        player: { id: player.id },
        user: { id: player.userId },
        hand: { id: hand.id },
      });

      await manager.getRepository(BlackjackBet).save(newBet);
      await this.userService.updateBalance(player.userId, -betAmount, manager, {
        logType: BalanceLogType.BET_PLACED,
        gameId: player.gameId,
        gameType: 'blackjack',
        playerId: player.id,
        reason: 'Split hand bet',
      });
    });
  }

  async checkForInsurance(game: BlackjackGame): Promise<void> {
    const rank = game.dealerHand[1].slice(0, -1);
    this.blackjackManager.clearInsuranceResponses(game.id);

    if (['10', 'J', 'Q', 'K'].includes(rank)) {
      for (const player of game.players.filter((player) => player.bets.length > 0)) {
        await this.blackjackHandRepository.update({ id: player.hands[0].id }, { hasStood: true });
      }

      await this.checkAndFinishRound(game.id);

      return;
    }

    const deadline = new Date(Date.now() + 10 * 1000);
    game.timerDeadline = deadline;
    game.timerType = 'player_turn';
    await this.save(game);

    this.blackjackManager.startPlayerTimer(game.id, game.currentPlayerId, 10);
    this.dispatcher.emitNextTurn(game.lobbyId, deadline);
  }

  async checkForDealNow(game: BlackjackGame): Promise<void> {
    try {
      this.blackjackManager.cancelGameStart(game.lobbyId);
      await this.getCurrentGameAndEmit(game.lobbyId);
      await this.startGame(game.id);
      return;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async checkAndFinishRound(gameId: string): Promise<BlackjackGame | void> {
    const game = await this.blackjackGameRepository.findOne({
      where: { id: gameId },
      relations: ['players', 'players.hands', 'players.user', 'players.bets', 'lobby', 'lobby.owner'],
    });

    if (!game) return;

    if (game.status === BlackjackGameStatus.COUNTDOWN && game.players.length === 0) {
      game.status = BlackjackGameStatus.WAITING_PLAYERS;
      await this.blackjackGameRepository.save(game);
    }

    if (game.status !== BlackjackGameStatus.PLAYING) return;

    const allDone = game.players.every((p) => p.hands.length > 0 && p.hands.every((h) => h.hasStood || h.isBusted));

    if (!allDone) return;

    await this.blackjackGameRepository.update({ id: game.id }, { status: BlackjackGameStatus.DEALER_PLAYING });

    this.dispatcher.emitBlackjackStatusUpdate(game.lobbyId, BlackjackGameStatus.DEALER_PLAYING);

    await this.playDealerHand(game);

    return game;
  }

  async advanceToNextPlayer(gameId: string) {
    const game = await this.blackjackGameRepository.findOne({
      where: { id: gameId },
      relations: ['players', 'players.user', 'players.hands', 'players.bets', 'lobby', 'lobby.owner'],
    });

    if (!game) throw new ServiceError('Active game not found');

    const players = game.players;

    if (!game.currentPlayerId) {
      const currentPlayer = await this.blackjackPlayerService.getCurrentPlaying(game.players);
      game.currentPlayerId = currentPlayer?.userId ?? '';
      await this.blackjackGameRepository.update({ id: game.id }, { currentPlayerId: game.currentPlayerId });
    }

    const currentPlayer = players.find((p) => p.userId === game.currentPlayerId);

    if (!currentPlayer) {
      return await this.playDealerHand(game);
    }

    if (currentPlayer.hands?.length === 1 && !currentPlayer.hands[0]?.isBusted && !currentPlayer.hands[0]?.hasStood) {
      const deadline = new Date(Date.now() + 10 * 1000);
      game.timerDeadline = deadline;
      game.timerType = 'player_turn';
      await this.blackjackGameRepository.update({ id: game.id }, { timerDeadline: deadline, timerType: 'player_turn' });

      this.dispatcher.emitNextTurn(game.lobbyId, deadline);
      this.blackjackManager.startPlayerTimer(game.id, game.currentPlayerId, 10);
      await this.getCurrentGameAndEmit(game.lobbyId);
      return;
    }

    for (const hand of currentPlayer.hands.sort((hand1, hand2) => hand2.handIndex - hand1.handIndex)) {
      if (!hand.isBusted && !hand.hasStood) {
        currentPlayer.currentHandId = hand.id;
        await this.blackjackPlayerService.update(currentPlayer.id, { currentHandId: hand.id });

        const deadline = new Date(Date.now() + 10 * 1000);
        game.timerDeadline = deadline;
        game.timerType = 'player_turn';
        await this.blackjackGameRepository.update(
          { id: game.id },
          { timerDeadline: deadline, timerType: 'player_turn' },
        );

        this.dispatcher.emitNextTurn(game.lobbyId, deadline);
        this.blackjackManager.startPlayerTimer(game.id, game.currentPlayerId, 10);
        await this.getCurrentGameAndEmit(game.lobbyId);

        return;
      }
    }

    const currentSeatIndex = players.find((p) => p.userId === game.currentPlayerId)?.seatIndex ?? -1;
    for (let i = currentSeatIndex + 1; i <= 4; i++) {
      const nextPlayer = players.find((p) => p.seatIndex === i);
      if (!nextPlayer) continue;

      game.currentPlayerId = nextPlayer.userId;

      const deadline = new Date(Date.now() + 10 * 1000);
      game.timerDeadline = deadline;
      game.timerType = 'player_turn';
      await this.blackjackGameRepository.save(game);

      this.dispatcher.emitNextTurn(game.lobbyId, deadline);
      this.blackjackManager.startPlayerTimer(game.id, game.currentPlayerId, 10);
      await this.getCurrentGameAndEmit(game.lobbyId);

      return;
    }

    this.blackjackManager.scheduleStateTransition(game.lobbyId, 200);
  }

  async playDealerHand(game: BlackjackGame) {
    const dealerHasFaceCard = ['10', 'J', 'Q', 'K', 'A'].includes(game.dealerHand[0]?.slice(0, -1));

    // If at least one user didn't bust and doesn't have a blackjack, draw dealer cards
    if (
      game.players.some((player) =>
        player.hands.some(
          (hand) => !hand.isBusted && !(hand.hand.length === 2 && hand?.handTotal === 21 && !dealerHasFaceCard),
        ),
      )
    ) {
      await this.scheduleDealerDrawCards(game);
    } else {
      await this.blackjackGameRepository.update({ id: game.id }, { dealerHand: [game.dealerHand[0]] });
    }

    const currentGame = await this.getActiveGame(game.lobbyId);
    if (!currentGame) return;

    await this.resolvePlayerWinnings(currentGame);

    await this.resolvePlayerPayoutsAndStats(currentGame);

    await this.blackjackGameRepository.update({ id: currentGame.id }, { status: BlackjackGameStatus.FINISHED });

    await this.getCurrentGameAndEmit(currentGame.lobbyId);

    this.blackjackManager.scheduleStateTransition(currentGame.lobbyId, 200);
    this.dispatcher.emitGameStats(currentGame.lobbyId);

    Logger.debug(`Blackjack (${currentGame.lobbyId}) - Dealer has played hand`, 'Blackjack');
  }

  async scheduleDealerDrawCards(game: BlackjackGame): Promise<void> {
    game.dealerHandTotal = this.calculateHandValue(game.dealerHand);

    await this.blackjackGameRepository.update(
      { id: game.id },
      { dealerHand: game.dealerHand, dealerHandTotal: game.dealerHandTotal },
    );

    await this.getCurrentGameAndEmit(game.lobbyId);
    await this.blackjackScheduler.delay(1300);

    if (game.players.length === 1 && game.players[0]?.hands.length === 1) {
      const userHand = game.players[0].hands[0];
      const playerHasBlackjack = userHand.hand.length === 2 && userHand.handTotal === 21;
      const dealerHasBlackjack = game.dealerHand.length === 2 && game.dealerHandTotal === 21;

      if (playerHasBlackjack && !dealerHasBlackjack) return;
    }

    while (game.dealerHandTotal < 17) {
      game.dealerHand.push(this.drawCard(game));
      game.dealerHandTotal = this.calculateHandValue(game.dealerHand);
      await this.blackjackGameRepository.update(
        { id: game.id },
        { dealerHand: game.dealerHand, dealerHandTotal: game.dealerHandTotal },
      );
      await this.getCurrentGameAndEmit(game.lobbyId);

      await this.blackjackScheduler.delay(1200);
    }
  }

  async resolvePlayerWinnings(currentGame: BlackjackGame): Promise<void> {
    const dealerBust = currentGame.dealerHandTotal > 21;
    const dealerHasBlackjack = currentGame.dealerHandTotal === 21 && currentGame.dealerHand.length === 2;

    for (const player of currentGame.players) {
      for (const hand of player.hands) {
        hand.handTotal = this.calculateHandValue(hand.hand);

        const userHasBlackjack = hand.handTotal === 21 && hand.hand.length === 2 && !hand.hasSplitted;

        hand.isBusted = hand.handTotal > 21;
        if (hand.isBusted || (dealerHasBlackjack && !userHasBlackjack)) {
          hand.payoutResult = 'lose';

          const userHandBets = player.bets.filter(
            (bet) => bet.handId === hand.id && bet.betPlace === BlackjackBetPlace.MAIN && !bet.insurance,
          );

          for (const bet of userHandBets) {
            bet.wonAmount = 0;
            bet.profitAmount = -bet.amount;
          }
          await this.blackjackBetRepository.save(userHandBets);
        } else if (
          dealerBust ||
          hand.handTotal > currentGame.dealerHandTotal ||
          (userHasBlackjack && !dealerHasBlackjack)
        ) {
          hand.payoutResult = 'win';

          const userHandBets = player.bets.filter(
            (bet) => bet.handId === hand.id && bet.betPlace === BlackjackBetPlace.MAIN && !bet.insurance,
          );

          let multiplier = 2;

          if (userHasBlackjack) {
            multiplier = 2.5;
          }

          for (const bet of userHandBets) {
            bet.wonAmount = this.handleBetPayout(bet, currentGame.lobby, multiplier);
            bet.profitAmount = bet.wonAmount - bet.amount;
          }

          await this.blackjackBetRepository.save(userHandBets);
        } else if (hand.handTotal < currentGame.dealerHandTotal) {
          hand.payoutResult = 'lose';

          const userHandBets = player.bets.filter(
            (bet) => bet.handId === hand.id && bet.betPlace === BlackjackBetPlace.MAIN && !bet.insurance,
          );

          for (const bet of userHandBets) {
            bet.wonAmount = 0;
            bet.profitAmount = -bet.amount;
          }

          await this.blackjackBetRepository.save(userHandBets);
        } else {
          hand.payoutResult = 'push';
          const userHandBets = player.bets.filter(
            (bet) => bet.handId === hand.id && bet.betPlace === BlackjackBetPlace.MAIN && !bet.insurance,
          );

          for (const bet of userHandBets) {
            bet.wonAmount = bet.amount;
            bet.profitAmount = 0;
          }

          await this.blackjackBetRepository.save(userHandBets);
        }
      }

      // Resolve insurance once per player (regardless of split count).
      if (player.insured) {
        const userInsuredBet = player.bets.find((bet) => bet.insurance === true);
        if (userInsuredBet) {
          if (dealerHasBlackjack) {
            // Insurance pays 2:1 (gross 3x stake). Capping happens in
            // resolvePlayerPayoutsAndStats together with main bet wins.
            userInsuredBet.wonAmount = userInsuredBet.amount * 3;
            userInsuredBet.profitAmount = userInsuredBet.wonAmount - userInsuredBet.amount;
          } else {
            // Dealer didn't have blackjack — insurance loses; lobby gains the stake.
            userInsuredBet.wonAmount = 0;
            userInsuredBet.profitAmount = -userInsuredBet.amount;
          }
          await this.blackjackBetRepository.save(userInsuredBet);
        }
      }

      await this.updateToResolvingBetsStatus(currentGame);
      await this.blackjackHandRepository.save(player.hands);
    }
  }

  async resolvePlayerPayoutsAndStats(currentGame: BlackjackGame): Promise<void> {
    const dealerHasFaceCard = ['10', 'J', 'Q', 'K', 'A'].includes(currentGame.dealerHand[0]?.slice(0, -1));

    const isPhase3Player = (player: BlackjackPlayer): boolean => {
      // Players whose main bet hasn't been paid yet — i.e. anyone except natural-BJ
      // winners against a non-face-card dealer (those were paid in resolvePlayerStartingBets).
      return (
        player.hands[0]?.hand.length !== 2 ||
        player.hands[0]?.handTotal !== 21 ||
        dealerHasFaceCard ||
        player.hands[0]?.hasSplitted
      );
    };

    if (currentGame.status !== BlackjackGameStatus.RESOLVING_USER_PAYOUTS) {
      const displayDelay = currentGame.dealerHand.length * 500 + 1000;
      await this.blackjackScheduler.delay(displayDelay);

      // Cap remaining payouts (regular main bets + insurance) against current bankroll.
      const phase3Bets = currentGame.players
        .filter(isPhase3Player)
        .flatMap((player) => player.bets.filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN));

      this.capWinningBetsToBankroll(phase3Bets, currentGame.lobby.bankroll);
      if (phase3Bets.length > 0) {
        await this.blackjackBetRepository.save(phase3Bets);
      }
    }

    await this.blackjackGameRepository.update(
      { id: currentGame.id },
      { status: BlackjackGameStatus.RESOLVING_USER_PAYOUTS },
    );

    const updatedPlayers = await this.blackjackPlayerService.getGameUnpayedPlayers(currentGame.id, ['bets', 'hands']);

    if (updatedPlayers && updatedPlayers.length > 0) {
      const updatedRegularPlayers = updatedPlayers.filter(isPhase3Player);

      for (const player of updatedRegularPlayers) {
        const playerWonAmount = player.bets
          .filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN)
          .reduce((sum, bet) => sum + bet.wonAmount, 0);

        const playerProfitAmount = player.bets
          .filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN)
          .reduce((sum, bet) => sum + bet.profitAmount, 0);

        if (playerProfitAmount >= 0 || (player.hands[0]?.hasSplitted && playerWonAmount > 0)) {
          await this.userService.updateBalance(player.userId, playerWonAmount, undefined, {
            logType: BalanceLogType.GAME_PAYOUT,
            gameId: currentGame.id,
            gameType: 'blackjack',
            playerId: player.id,
            lobbyId: currentGame.lobbyId,
            reason:
              playerProfitAmount === 0
                ? 'Blackjack push (tie)'
                : player.hands[0]?.hasSplitted && playerProfitAmount < 0
                  ? 'Lost blackjack hand'
                  : 'Won blackjack hand',
          });
        }

        await this.blackjackPlayerService.update(player.id, { payedOut: true });
      }
    }

    if (!currentGame.payedOut) {
      await this.resolveLobbyPayoutsAndStats(currentGame);
    }

    await this.getCurrentGameAndEmit(currentGame.lobbyId);
  }

  async resolveLobbyPayoutsAndStats(currentGame: BlackjackGame) {
    // Atomically claim the right to do the lobby-side bookkeeping for this game,
    // so a state-machine retry that re-enters resolvePlayerPayoutsAndStats can
    // never deduct the bankroll twice.
    const claim = await this.blackjackGameRepository
      .createQueryBuilder()
      .update()
      .set({ payedOut: true })
      .where('id = :id', { id: currentGame.id })
      .andWhere('payed_out = false')
      .execute();

    if (claim.affected === 0) {
      return;
    }

    const gamePlayers = await this.blackjackPlayerService.getGamePlayers(currentGame.id, ['bets', 'hands']);
    if (!gamePlayers || gamePlayers.length <= 0) return;

    const dealerHasFaceCard = ['10', 'J', 'Q', 'K', 'A'].includes(currentGame.dealerHand[0]?.slice(0, -1));

    const isPhase3Player = (player: BlackjackPlayer): boolean =>
      player.hands[0]?.hand.length !== 2 ||
      player.hands[0]?.handTotal !== 21 ||
      dealerHasFaceCard ||
      player.hands[0]?.hasSplitted;

    // Phase 3 deducts the bankroll only for bets that have not been settled yet:
    // regular players' main bets and any insurance bets. Side bets and natural-BJ
    // main bets were already settled by resolvePlayerStartingBets.
    const phase3Bets = gamePlayers
      .filter(isPhase3Player)
      .flatMap((player) => player.bets.filter((bet) => bet.betPlace === BlackjackBetPlace.MAIN));

    const sumPhase3Profit = phase3Bets.reduce((sum, bet) => sum + bet.profitAmount, 0);
    const sumPhase3Bet = phase3Bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (sumPhase3Profit !== 0) {
      await this.lobbyService.updateBankroll(currentGame.lobbyId, -sumPhase3Profit, undefined, {
        gameId: currentGame.id,
        reason: 'Resolve Lobby Payouts and stats',
        logType: TransactionType.GAME_BET_RESULT,
      });
    }

    if (sumPhase3Bet > 0 || sumPhase3Profit !== 0) {
      await this.updateGameStats(currentGame.lobbyId, currentGame.id, sumPhase3Bet, -sumPhase3Profit);
    }
  }

  async calculateHandBetAmount(handId: string): Promise<number> {
    const handBets = await this.blackjackBetRepository.find({
      where: { hand: { id: handId }, betPlace: BlackjackBetPlace.MAIN },
    });

    return handBets?.reduce((acc, curr) => (acc += curr.amount), 0);
  }

  async calculateHandWonAmount(handId: string): Promise<number> {
    const handBets = await this.blackjackBetRepository.find({
      where: { hand: { id: handId }, betPlace: BlackjackBetPlace.MAIN },
    });

    return handBets?.reduce((acc, curr) => (acc += curr.wonAmount), 0);
  }

  async calculateSideWonAmount(playerId: string): Promise<number> {
    const handBets = await this.blackjackBetRepository.find({
      where: { player: { id: playerId }, betPlace: In([BlackjackBetPlace.PERFECT_PAIR, BlackjackBetPlace.SIDE21_3]) },
    });

    return handBets?.reduce((acc, curr) => (acc += curr.wonAmount), 0);
  }

  async calculateSideProfitAmount(playerId: string): Promise<number> {
    const handBets = await this.blackjackBetRepository.find({
      where: { player: { id: playerId }, betPlace: In([BlackjackBetPlace.PERFECT_PAIR, BlackjackBetPlace.SIDE21_3]) },
    });

    return handBets?.reduce((acc, curr) => (acc += curr.profitAmount), 0);
  }

  async calculateSideBetAmount(playerId: string): Promise<number> {
    const handBets = await this.blackjackBetRepository.find({
      where: { player: { id: playerId }, betPlace: In([BlackjackBetPlace.PERFECT_PAIR, BlackjackBetPlace.SIDE21_3]) },
    });

    return handBets?.reduce((acc, curr) => (acc += curr.amount), 0);
  }

  async finishDoubleDownPlayers(players: BlackjackPlayer[]): Promise<void> {
    for (const player of players) {
      const doubledHands = player.hands.filter((hand) => hand.hasDoubled);

      for (const hand of doubledHands) {
        hand.isDoubledRevealed = true;
        hand.handTotal = this.calculateHandValue(hand.hand);
        await this.blackjackHandRepository.save(hand);
      }
    }
  }

  async updateGameStats(lobbyId: string, gameId: string, totalBetAmount: number, profitAmount: number) {
    await this.blackjackGameRepository
      .createQueryBuilder()
      .update()
      .set({
        profitAmount: () => `profit_amount + ${profitAmount}`,
        wagered: () => `wagered + ${totalBetAmount}`,
      })
      .where('id = :id', { id: gameId })
      .execute();

    await this.lobbyService.updateLobbyBlackjackStats(lobbyId, totalBetAmount, profitAmount);
  }

  drawCard(game: BlackjackGame): string {
    const card = game.deck.shift();
    if (!card) throw new ServiceError('Deck is empty');
    return card;
  }

  generateShuffledDeck(serverSeed: string, randomOrgString: string, numOfDecks = 1): string[] {
    const suits = ['H', 'D', 'C', 'S'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: string[] = [];

    for (let deckNum = 0; deckNum < numOfDecks; deckNum++) {
      for (const suit of suits) {
        for (const value of values) {
          deck.push(`${value}${suit}`);
        }
      }
    }

    const baseHash = crypto.createHash('sha256').update(`${serverSeed}:${randomOrgString}`).digest('hex');

    for (let i = deck.length - 1; i > 0; i--) {
      const positionHash = crypto.createHash('sha256').update(`${baseHash}:${i}`).digest('hex');
      const randomValue = parseInt(positionHash.substring(0, 8), 16);
      const j = randomValue % (i + 1);

      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  calculateHandValue(hand: string[]): number {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
      const rank = card.slice(0, -1);
      if (['J', 'Q', 'K'].includes(rank)) value += 10;
      else if (rank === 'A') {
        aces += 1;
        value += 11;
      } else {
        value += parseInt(rank, 10);
      }
    }

    while (value > 21 && aces > 0) {
      value -= 10;
      aces -= 1;
    }

    return value;
  }

  canSplit(hand: BlackjackHand, player: BlackjackPlayer): boolean {
    if (hand.hand.length !== 2) return false;

    if (player.hands.length > 1) return false;

    if (hand.hasDoubled || hand.hasStood) return false;

    const rank1 = hand.hand[0].slice(0, -1);
    const rank2 = hand.hand[1].slice(0, -1);

    return rank1 === rank2;
  }

  canDoubleDown(hand: BlackjackHand): boolean {
    if (hand.hand.length !== 2) return false;

    if (hand.hasDoubled || hand.hasStood || hand.hasSplitted) return false;

    const handValue = this.calculateHandValue(hand.hand);
    if (handValue >= 21) return false;

    return true;
  }

  async updateToResolvingBetsStatus(currentGame: BlackjackGame) {
    await this.blackjackGameRepository.update({ id: currentGame.id }, { status: BlackjackGameStatus.RESOLVING_BETS });
    this.dispatcher.emitBlackjackGameUpdate({ ...currentGame, status: BlackjackGameStatus.RESOLVING_BETS });
  }

  async refundAllBets(gameId: string): Promise<void> {
    const logger = new Logger('BlackjackService');

    try {
      const game = await this.blackjackGameRepository.findOne({
        where: { id: gameId },
        relations: ['players', 'players.bets', 'players.user'],
      });

      if (!game) {
        logger.error(`Game ${gameId} not found for refund`);
        return;
      }

      await this.dataSource.transaction(async (manager) => {
        for (const player of game.players) {
          if (!player.bets || player.bets.length === 0) continue;

          // Refund EVERY un-resolved bet stake (including winning bets that
          // never got paid because the game was killed). The previous code
          // refunded only bets with wonAmount === 0, which stranded any
          // bet that had been marked as a winner mid-resolution.
          const playerRefundAmount = player.bets.reduce((sum, bet) => sum + bet.amount, 0);

          if (playerRefundAmount > 0) {
            await this.userService.updateBalance(player.userId, playerRefundAmount, manager, {
              logType: BalanceLogType.GAME_PAYOUT,
              gameId: game.id,
              gameType: 'blackjack',
              playerId: player.id,
              lobbyId: game.lobbyId,
              reason: 'Bet refunded - game cancelled',
            });
            logger.log(`Refunded ${playerRefundAmount} to user ${player.userId} for game ${gameId}`);
          }
        }

        // The lobby bankroll is NOT credited here. Bet stakes never landed in
        // the lobby bankroll on placement, so refunding them does not deduct
        // anything from the lobby. Crediting it would manufacture money.
      });
    } catch (error) {
      logger.error(`Error in refundAllBets for game ${gameId}:`, error);
      throw error;
    }
  }
}
