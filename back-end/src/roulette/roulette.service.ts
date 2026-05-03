import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { DataSource, EntityManager, LessThan, Not, QueryFailedError, Repository } from 'typeorm';
import { ServiceError } from '../common/service.error';
import { getRandomString } from '../common/utils';
import { LobbyDeatilStatisticsDTO } from '../lobby/dto/lobby-detail-stats.dto';
import { RouletteBetDTO } from '../lobby/dto/roulette-bet.dto';
import { RouletteRemoveBetDTO } from '../lobby/dto/roulette-remove-bet.dto';
import { Lobby, LobbyState } from '../lobby/lobby.entity';
import { LobbyService } from '../lobby/lobby.service';
import { RandomOrgService } from '../random-org/random-org.service';
import { SocketDispatcher } from '../socket/dispatcher/dispatcher';
import { UserService } from '../user/user.service';
import { RouletteBetHistoryPaginatedDTO } from './dto/roulette-bet-history-paginated.dto';
import { RouletteBetHistoryDTO } from './dto/roulette-bet-history.dto';
import { RouletteGameStatisticsDTO } from './dto/roulette-game-stats.dto';
import { RouletteBetPlace } from './roulette-bet-place.enum';
import { RouletteBet } from './roulette-bet.entity';
import { RouletteGame, RouletteGameStatus } from './roulette-game.entity';
import { betPlaceToNumbers, mapPayoutMultiplier } from './utils';
import { MaintenanceService } from 'src/maintenance/maintenance.service';
import { MaintenanceType } from 'src/maintenance/maintenance.entity';
import { BalanceLogType } from '../user/user-balance-log.entity';
import { TransactionType } from '../transaction/lobby/lobby-transaction.entity';
import { RouletteAggregatedBetDTO } from './dto/roulette-aggregated-bet.dto';

interface BetSummary {
  betPlace: RouletteBetPlace;
  totalAmount: number;
  possibleWin: number;
}

@Injectable()
export class RouletteService {
  constructor(
    @InjectRepository(RouletteGame) private readonly rouletteGameRepository: Repository<RouletteGame>,
    @InjectRepository(RouletteBet) private readonly rouletteBetRepository: Repository<RouletteBet>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly randomOrgService: RandomOrgService,
    private readonly dispatcher: SocketDispatcher,
    private readonly userService: UserService,
    private readonly lobbyService: LobbyService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  async getPlayerBetHistory(userId: string, page = 1, limit = 10): Promise<RouletteBetHistoryPaginatedDTO> {
    const offset = (page - 1) * limit;

    const qb = this.rouletteBetRepository
      .createQueryBuilder('bet')
      .leftJoin('bet.game', 'game')
      .leftJoin('game.lobby', 'lobby')
      .where('bet.user_id = :userId', { userId })
      .andWhere('game.status = :status', { status: RouletteGameStatus.FINISHED })
      .select([
        'game.id AS "gameId"',
        'lobby.code AS "lobbyCode"',
        'lobby.inviteLink AS "inviteLink"',
        'lobby.status AS "status"',
        'SUM(bet.amount) AS "totalBet"',
        'SUM(bet.wonAmount) AS "totalWon"',
        'MAX(game.createdAt) AS "createdAt"',
      ])
      .groupBy('game.id')
      .addGroupBy('lobby.inviteLink')
      .addGroupBy('lobby.status')
      .addGroupBy('lobby.code')
      .orderBy('MAX(game.createdAt)', 'DESC')
      .limit(limit)
      .offset(offset);

    const results = await qb.getRawMany<RouletteBetHistoryDTO>();

    const totalQb = this.rouletteBetRepository
      .createQueryBuilder('bet')
      .leftJoin('bet.game', 'game')
      .leftJoin('game.lobby', 'lobby')
      .where('bet.user_id = :userId', { userId })
      .andWhere('game.status = :status', { status: RouletteGameStatus.FINISHED })
      .select('COUNT(DISTINCT game.id)', 'total');

    const totalRaw = await totalQb.getRawOne<{ total: string }>();
    const total = parseInt(totalRaw?.total ?? '0', 10);

    return new RouletteBetHistoryPaginatedDTO({
      data: results.map(
        (row) =>
          new RouletteBetHistoryDTO({
            gameId: row.gameId,
            status: row.status,
            lobbyCode: row.lobbyCode,
            inviteLink: row.inviteLink,
            totalBet: Number(row.totalBet),
            totalWon: Number(row.totalWon),
            createdAt: row.createdAt,
          }),
      ),
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  }

  async getLobbyDetailStatistics(ownerId: string, lobbyId: string): Promise<LobbyDeatilStatisticsDTO> {
    const lobby = await this.lobbyService.getLobbyById(lobbyId);
    if (!lobby) throw new ServiceError('Lobby not found');
    if (lobby.ownerId !== ownerId) throw new ServiceError('Lobby not owned by the user');

    const latestGamesRaw = await this.rouletteGameRepository
      .createQueryBuilder('game')
      .leftJoin('game.bets', 'bet')
      .leftJoin('bet.user', 'user')
      .select(['game.id', 'game.updatedAt'])
      .addSelect('COUNT(DISTINCT user.id)', 'usersCount')
      .where('game.lobby_id = :lobbyId', { lobbyId })
      .andWhere('game.status = :status', { status: RouletteGameStatus.FINISHED })
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

    const betsAggRawLatest = await this.rouletteBetRepository
      .createQueryBuilder('bet')
      .select('bet.game_id', 'game_id')
      .addSelect('COALESCE(SUM(bet.amount), 0)', 'wagered')
      .addSelect('COALESCE(SUM(bet.amount - bet.wonAmount), 0)', 'netProfit')
      .andWhere('bet.game_id IN (:...gameIds)', { gameIds: latestGameIds })
      .groupBy('bet.game_id')
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

    const totalPlayersRaw = await this.rouletteBetRepository
      .createQueryBuilder('bet')
      .select('bet.game_id', 'game_id')
      .addSelect('COUNT(DISTINCT bet.user_id)', 'betsCount')
      .innerJoin('bet.game', 'game')
      .where('game.lobby_id = :lobbyId', { lobbyId })
      .andWhere('game.status = :status', { status: RouletteGameStatus.FINISHED })
      .groupBy('bet.game_id')
      .getRawMany<{ game_id: string; betsCount: string }>();

    const totalBetsCount = totalPlayersRaw.reduce((sum, g) => sum + Number(g.betsCount), 0);

    const gameStats: RouletteGameStatisticsDTO[] = [];

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
      netProfit: lobby.rouletteProfitAmount,
      wagered: lobby.rouletteWagered,
      totalBets: totalBetsCount,
      activatedAt: lobby.activatedAt,
    });
  }

  checkForCurrentRollNowCount(lobbyId: string, count: number): void {
    this.dispatcher.emitRollNowCount(lobbyId, count);
  }

  async checkForRollNow(game: RouletteGame): Promise<void> {
    await this.startGame(game.lobbyId);
    await this.getCurrentGameAndEmit(game.lobbyId);
    await this.delay(500);
    this.dispatcher.emitRouletteBallSpin(game.lobbyId);
    return;
  }

  async getActiveGame(lobbyId: string): Promise<RouletteGame | null> {
    return await this.rouletteGameRepository.findOne({
      where: { lobby: { id: lobbyId }, isCurrent: true },
      relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
    });
  }

  async getGamesHistory(lobbyId: string): Promise<RouletteGame[] | null> {
    return await this.rouletteGameRepository.find({
      where: { lobby: { id: lobbyId }, status: RouletteGameStatus.FINISHED },
      select: ['id', 'result', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: 22,
    });
  }

  async getUserBets(lobbyId: string, userId: string): Promise<RouletteBet[] | null> {
    return await this.rouletteBetRepository.find({
      where: { game: { lobby: { id: lobbyId }, isCurrent: true }, user: { id: userId } },
      relations: ['user'],
    });
  }

  public async findFairnessHistoryGamesByLobbyId(lobbyId: string): Promise<RouletteGame[]> {
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);

    return await this.rouletteGameRepository.find({
      where: {
        lobby: { id: lobbyId },
        status: RouletteGameStatus.FINISHED,
        serverSeed: Not('NULL'),
        fairnessRandom: Not('NULL'),
        updatedAt: LessThan(fifteenSecondsAgo),
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async findFairnessGameById(gameId: string): Promise<RouletteGame> {
    const game = await this.rouletteGameRepository.findOne({ where: { id: gameId } });

    if (!game || game.status !== RouletteGameStatus.FINISHED) {
      throw new ServiceError('Game not found');
    }

    return game;
  }

  async createOrGetActiveGame(lobbyId: string): Promise<RouletteGame | null> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const lobby = await manager.getRepository(Lobby).findOne({
          where: {
            id: lobbyId,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!lobby || ![LobbyState.ACTIVE, LobbyState.PAUSED].includes(lobby.status)) {
          Logger.debug(`Cannot create game for lobby ${lobbyId} - lobby not active or paused`, 'RouletteService');
          return null;
        }

        let game = await manager.getRepository(RouletteGame).findOne({
          where: { lobby: { id: lobbyId }, isCurrent: true },
          relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
        });

        if (game) {
          const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
          if (game.status === RouletteGameStatus.FINISHED && game.updatedAt < thirtySecondsAgo) {
            await this.rouletteGameRepository.update({ id: game.id }, { isCurrent: false });
          } else {
            return game;
          }
        }

        if (await this.maintenanceService.isInMaintenance([MaintenanceType.PAUSE, MaintenanceType.PAUSE_ROULETTE])) {
          Logger.debug(`Cannot create game for lobby ${lobbyId} - in maintenance mode`, 'RouletteService');
          return null;
        }

        Logger.debug(`Creating new game for lobby ${lobbyId}`, 'RouletteService');
        const serverSeed = getRandomString(128);
        const newGame = manager.getRepository(RouletteGame).create({
          isCurrent: true,
          lobby: { id: lobbyId },
          status: RouletteGameStatus.WAITING_BETS,
          serverSeed,
          bets: [],
        });

        try {
          game = await manager.getRepository(RouletteGame).save(newGame);

          game = await manager.getRepository(RouletteGame).findOne({
            where: { id: game.id },
            relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
          });

          Logger.log(`Created new game ${game?.id} for lobby ${lobbyId}`, 'RouletteService');
        } catch (err) {
          if (err instanceof QueryFailedError) {
            const pgError = err.driverError as { code?: string };

            if (pgError.code === '23505') {
              Logger.warn(
                `Duplicate game creation attempt for lobby ${lobbyId} - fetching existing game`,
                'RouletteService',
              );
              game = await manager.getRepository(RouletteGame).findOne({
                where: { lobby: { id: lobbyId }, isCurrent: true },
                relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
              });
              return game;
            }
          }

          Logger.error(
            `Failed to create game for lobby ${lobbyId}: ${(err as Error).message}`,
            undefined,
            'RouletteService',
          );
          throw err;
        }

        return game;
      });
    } catch (error) {
      Logger.error(
        `Transaction failed in createOrGetActiveGame for lobby ${lobbyId}: ${(error as Error).message}`,
        (error as Error).stack,
        'RouletteService',
      );
      throw error;
    }
  }

  getDistinctUserIds(game: RouletteGame): string[] {
    return [...new Set(game.bets.map((bet) => bet.userId))];
  }

  async getUnfinishedGames(): Promise<RouletteGame[]> {
    return await this.rouletteGameRepository.find({
      where: [
        { status: RouletteGameStatus.COUNTDOWN, isCurrent: true },
        { status: RouletteGameStatus.PLAYING, isCurrent: true },
        { status: RouletteGameStatus.FINISHED, isCurrent: true },
      ],
      relations: ['lobby', 'bets'],
    });
  }

  async refundAllBets(gameId: string): Promise<void> {
    try {
      const game = await this.rouletteGameRepository.findOne({
        where: { id: gameId },
        relations: ['bets', 'bets.user'],
      });

      if (!game) {
        Logger.warn(`Cannot refund bets - game ${gameId} not found`, 'RouletteService');
        return;
      }

      await this.dataSource.transaction(async (manager) => {
        for (const bet of game.bets) {
          await this.userService.updateBalance(bet.userId, bet.amount, manager, {
            logType: BalanceLogType.GAME_PAYOUT,
            gameId: game.id,
            gameType: 'roulette',
            lobbyId: game.lobbyId,
            reason: 'Bet refunded - game cancelled',
          });
        }

        await manager.getRepository(RouletteBet).delete({ game: { id: gameId } });
      });

      Logger.log(`Refunded ${game.bets.length} bets for game ${gameId}`, 'RouletteService');
    } catch (error) {
      Logger.error(
        `Failed to refund bets for game ${gameId}: ${(error as Error).message}`,
        (error as Error).stack,
        'RouletteService',
      );
      throw error;
    }
  }

  async save(game: RouletteGame): Promise<void> {
    await this.rouletteGameRepository.save(game);
  }

  async update(gameId: string, game: Partial<RouletteGame>): Promise<void> {
    await this.rouletteGameRepository.update({ id: gameId }, { ...game });
  }

  async startGame(lobbyId: string): Promise<void> {
    try {
      const currentGame = await this.getActiveGame(lobbyId);

      if (!currentGame) {
        Logger.warn(`Cannot start game - no active game found for lobby: ${lobbyId}`, 'RouletteService');
        throw new ServiceError('Active game not found');
      }

      if (currentGame.bets.length <= 0) {
        Logger.debug(`Game ${currentGame.id} has no bets - reverting to WAITING_BETS status`, 'RouletteService');
        await this.rouletteGameRepository
          .createQueryBuilder()
          .update()
          .set({ status: RouletteGameStatus.WAITING_BETS, timerDeadline: null, timerType: null })
          .where('id = :id', { id: currentGame.id })
          .andWhere('status IN (:...allowed)', {
            allowed: [RouletteGameStatus.COUNTDOWN, RouletteGameStatus.WAITING_BETS],
          })
          .execute();
        return;
      }

      // Reserve the right to spin: only one caller can flip COUNTDOWN -> PLAYING.
      // If another worker (cron retry, double timer, etc.) already started this
      // game, we get affected=0 and bail without re-rolling the result.
      const claim = await this.rouletteGameRepository
        .createQueryBuilder()
        .update()
        .set({ status: RouletteGameStatus.PLAYING })
        .where('id = :id', { id: currentGame.id })
        .andWhere('status = :status', { status: RouletteGameStatus.COUNTDOWN })
        .execute();

      if ((claim.affected ?? 0) === 0) {
        Logger.debug(
          `startGame: game ${currentGame.id} not in COUNTDOWN, skipping (already started or finished)`,
          'RouletteService',
        );
        return;
      }

      Logger.debug(
        `Starting game ${currentGame.id} in lobby ${lobbyId} with ${currentGame.bets.length} bets`,
        'RouletteService',
      );

      const randomOrgString = await this.randomOrgService.getRandomString();
      const gameResult = this.generateRouletteResult(currentGame.serverSeed, randomOrgString);

      await this.update(currentGame.id, {
        fairnessRandom: randomOrgString,
        result: gameResult,
        timerDeadline: null,
        timerType: null,
      });

      Logger.log(`Game ${currentGame.id} started in lobby ${lobbyId} - result: ${gameResult}`, 'RouletteService');
    } catch (error) {
      Logger.error(
        `Failed to start game for lobby ${lobbyId}: ${(error as Error).message}`,
        (error as Error).stack,
        'RouletteService',
      );
      throw error;
    }
  }

  generateRouletteResult(serverSeed: string, randomOrgString: string): number {
    const combinedHash = crypto.createHash('sha256').update(`${serverSeed}:${randomOrgString}`).digest('hex');

    return parseInt(combinedHash.slice(0, 8), 16) % 37;
  }

  verifyRouletteResult(serverSeed: string, serverSeedHash: string, randomOrgString: string) {
    const hash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    if (hash !== serverSeedHash) {
      Logger.error(
        `Server seed verification failed! Expected hash: ${serverSeedHash}, Got: ${hash}`,
        undefined,
        'RouletteService',
      );
      throw new Error('Server seed mismatch!');
    }

    const combinedHash = crypto.createHash('sha256').update(`${serverSeed}:${randomOrgString}`).digest('hex');

    const rouletteNumber = parseInt(combinedHash.slice(0, 8), 16) % 37;
    return rouletteNumber;
  }

  async finishGame(lobbyId: string): Promise<void> {
    try {
      Logger.debug(`Finishing game for lobby ${lobbyId}`, 'RouletteService');

      const currentGame = await this.getActiveGame(lobbyId);

      if (!currentGame) {
        Logger.warn(`Cannot finish game - no active game found for lobby: ${lobbyId}`, 'RouletteService');
        throw new ServiceError('Active game not found');
      }

      await this.handlePayouts(currentGame);
      await this.update(currentGame.id, { status: RouletteGameStatus.FINISHED });

      // Clear bet list on game finish
      this.dispatcher.emitRouletteBetsUpdate(lobbyId, []);

      Logger.log(`Game ${currentGame.id} finished in lobby ${lobbyId}`, 'RouletteService');
    } catch (error) {
      Logger.error(
        `Failed to finish game for lobby ${lobbyId}: ${(error as Error).message}`,
        (error as Error).stack,
        'RouletteService',
      );
      throw error;
    }
  }

  async prepareNextGame(lobbyId: string): Promise<void> {
    try {
      Logger.debug(`Preparing next game for lobby ${lobbyId}`, 'RouletteService');

      await this.dataSource.transaction(async (manager) => {
        const currentGame = await manager.getRepository(RouletteGame).findOne({
          where: { lobby: { id: lobbyId }, isCurrent: true },
          relations: ['lobby'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!currentGame) {
          Logger.warn(`Cannot prepare next game - no active game found for lobby: ${lobbyId}`, 'RouletteService');
          throw new ServiceError('Active game not found');
        }

        if (currentGame.status !== RouletteGameStatus.FINISHED) {
          Logger.warn(
            `Cannot prepare next game - current game ${currentGame.id} is not finished (status: ${currentGame.status})`,
            'RouletteService',
          );
          return;
        }

        if (await this.maintenanceService.isInMaintenance([MaintenanceType.PAUSE, MaintenanceType.PAUSE_ROULETTE])) {
          Logger.warn(
            `Next game preparation blocked - maintenance mode active for lobby: ${lobbyId}`,
            'RouletteService',
          );
          throw new ServiceError('Creating a new Roulette game has been paused.');
        }

        await manager.getRepository(RouletteGame).update({ id: currentGame.id }, { isCurrent: false });

        const serverSeed = getRandomString(128);

        const newGame = manager.getRepository(RouletteGame).create({
          isCurrent: true,
          lobby: { id: lobbyId },
          status: RouletteGameStatus.WAITING_BETS,
          serverSeed,
          bets: [],
        });

        try {
          const savedGame = await manager.getRepository(RouletteGame).save(newGame);

          const gameWithRelations = await manager.getRepository(RouletteGame).findOne({
            where: { id: savedGame.id },
            relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
          });

          if (gameWithRelations) {
            this.dispatcher.emitNewRouletteGame(gameWithRelations);
            // Emit empty bet list for new game
            this.dispatcher.emitRouletteBetsUpdate(lobbyId, []);
          }

          Logger.log(`New game ${savedGame.id} prepared for lobby ${lobbyId}`, 'RouletteService');
        } catch (err) {
          if (err instanceof QueryFailedError) {
            const pgError = err.driverError as { code?: string };

            if (pgError.code === '23505') {
              Logger.warn(
                `Duplicate game creation attempt detected for lobby ${lobbyId} - another game already exists`,
                'RouletteService',
              );
              return;
            }
          }
          throw err;
        }
      });
    } catch (error) {
      Logger.error(
        `Failed to prepare next game for lobby ${lobbyId}: ${(error as Error).message}`,
        (error as Error).stack,
        'RouletteService',
      );
      throw error;
    }
  }

  async placeBet(userId: string, data: RouletteBetDTO): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const lockedGame = await manager
          .createQueryBuilder(RouletteGame, 'game')
          .where('game.lobby_id = :lobbyId', { lobbyId: data.lobbyId })
          .andWhere('game.is_current = :isCurrent', { isCurrent: true })
          .setLock('pessimistic_write')
          .getOne();

        if (!lockedGame) {
          Logger.warn(`Bet placement failed - no active game found for lobby: ${data.lobbyId}`, 'RouletteService');
          throw new ServiceError('Active game not found');
        }

        const game = await manager.getRepository(RouletteGame).findOne({
          where: { id: lockedGame.id },
          relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
        });

        if (!game) {
          throw new ServiceError('Active game not found');
        }

        if (game.lobby.ownerId === userId) {
          throw new ServiceError('You cannot place bets in your own lobby');
        }

        if (game.lobby.status !== LobbyState.ACTIVE) {
          throw new ServiceError('Lobby is not active');
        }

        if (game.status !== RouletteGameStatus.WAITING_BETS && game.status !== RouletteGameStatus.COUNTDOWN) {
          throw new ServiceError('Betting is not available at the moment');
        }

        const multiplier = mapPayoutMultiplier(data.betPlace);

        if (multiplier <= 0) {
          throw new ServiceError('Invalid bet place');
        }

        const userBets = game.bets.filter((bet) => bet.userId === userId);

        const playerBetAmount = userBets?.reduce((sum, bet) => sum + bet.amount, 0) || 0;

        const totalBetAmount = playerBetAmount + data.amount;

        const maxBetDiffBeforeBet = game.lobby.rouletteMaxBet - playerBetAmount;
        const maxBetDiffAfterBet = game.lobby.rouletteMaxBet - totalBetAmount;

        let amountToBet = data.amount;

        if (maxBetDiffAfterBet < 0 && maxBetDiffBeforeBet >= 0) {
          amountToBet = maxBetDiffBeforeBet;
        }

        if (amountToBet <= 0) {
          throw new ServiceError(`Total max bet for the game is reached ($${game.lobby.rouletteMaxBet})`);
        }

        const lastBet = await manager.getRepository(RouletteBet).findOne({
          where: { user: { id: userId }, game: { id: game.id } },
          order: { version: 'DESC' },
        });

        await this.userService.updateBalance(userId, -amountToBet, manager, {
          logType: BalanceLogType.BET_PLACED,
          gameId: game.id,
          gameType: 'roulette',
          lobbyId: game.lobbyId,
          reason: `Placed roulette bet on ${data.betPlace}`,
        });

        const result = await manager.insert(RouletteBet, {
          amount: amountToBet,
          wonAmount: 0,
          betPlace: data.betPlace,
          version: lastBet ? lastBet.version + 1 : 0,
          user: { id: userId },
          game: { id: game.id },
        });

        const [{ id: betId }] = result.identifiers as { id: string }[];

        const bet = await manager.findOneOrFail(RouletteBet, {
          where: { id: betId },
          relations: ['user', 'game'],
        });

        this.dispatcher.emitRouletteBetPlaced(data.lobbyId, bet);

        const betsPerBetPlace = await manager.find(RouletteBet, {
          where: { betPlace: data.betPlace, game: { id: game.id } },
        });

        const maxPayoutBreached = this.calculateGroupedBets(betsPerBetPlace, game.lobby.rouletteBankroll);

        if (maxPayoutBreached) {
          this.dispatcher.emitRouletteMaxWinNotice(data.lobbyId, userId, game.id);
        }
      });
    } catch (error) {
      Logger.error(
        `Failed to place bet for user ${userId} in lobby ${data.lobbyId}: ${(error as Error).message}`,
        'RouletteService',
      );
      throw error;
    }
  }

  calculateGroupedBets(bets: RouletteBet[], currentBankroll: number): boolean {
    const grouped = bets.reduce(
      (acc, bet) => {
        if (!acc[bet.betPlace]) {
          acc[bet.betPlace] = 0;
        }
        acc[bet.betPlace] += bet.amount;
        return acc;
      },
      {} as Record<RouletteBetPlace, number>,
    );

    const results: BetSummary[] = Object.entries(grouped).map(([place, totalAmount]) => {
      const betPlace = place as RouletteBetPlace;
      const multiplier = mapPayoutMultiplier(betPlace);
      const possibleWin = totalAmount * multiplier;

      return {
        betPlace,
        totalAmount,
        possibleWin,
      };
    });

    return results.some((result) => result.possibleWin > currentBankroll);
  }

  /**
   * Removes the most-recent (highest-version) bet the user has placed on a
   * given betPlace and refunds its stake. Each chip placement is its own
   * row, so this corresponds to "remove the last chip" the player put on
   * that spot — repeat the call to remove additional chips.
   */
  async removeBet(userId: string, gameId: string, data: RouletteRemoveBetDTO): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const betRepo = manager.getRepository(RouletteBet);
      const userBetPlace = await betRepo.findOne({
        where: { user: { id: userId }, game: { id: gameId }, betPlace: data.betPlace },
        order: { version: 'DESC' },
        relations: ['user'],
      });

      if (!userBetPlace) return;

      await betRepo.remove(userBetPlace);
      await this.userService.updateBalance(userId, userBetPlace.amount, manager, {
        logType: BalanceLogType.GAME_PAYOUT,
        gameId,
        gameType: 'roulette',
        lobbyId: data.lobbyId,
        reason: `Bet refunded - undo ${data.betPlace}`,
      });

      this.dispatcher.emitRouletteUndoBets(userId, data.lobbyId, [userBetPlace]);
    });
  }

  async handleRebet(userId: string, currentGame: RouletteGame): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const locked = await manager
        .createQueryBuilder(RouletteGame, 'game')
        .where('game.id = :gameId', { gameId: currentGame.id })
        .andWhere('game.is_current = :isCurrent', { isCurrent: true })
        .setLock('pessimistic_write')
        .getOne();

      if (!locked) {
        throw new ServiceError('Current game not found or no longer active');
      }

      const lockedCurrentGame = await manager.getRepository(RouletteGame).findOne({
        where: { id: locked.id },
        relations: ['lobby', 'bets', 'bets.user'],
      });

      if (!lockedCurrentGame) {
        throw new ServiceError('Current game not found or no longer active');
      }

      if (
        lockedCurrentGame.status !== RouletteGameStatus.WAITING_BETS &&
        lockedCurrentGame.status !== RouletteGameStatus.COUNTDOWN
      ) {
        throw new ServiceError('Betting is not available at the moment');
      }

      const previousGame = await manager.getRepository(RouletteGame).findOne({
        where: { lobby: { id: lockedCurrentGame.lobbyId }, status: RouletteGameStatus.FINISHED },
        order: { updatedAt: 'DESC' },
        relations: ['bets'],
      });

      if (!previousGame) return;

      const previousBets = await manager.getRepository(RouletteBet).find({
        where: { user: { id: userId }, game: { id: previousGame.id } },
        relations: ['user'],
      });

      if (!previousBets || previousBets.length <= 0) return;

      const previousBetsTotal = previousBets.reduce((sum, bet) => sum + bet.amount, 0);

      const currentUserBets = lockedCurrentGame.bets.filter((bet) => bet.userId === userId);
      const currentUserBetsTotal = currentUserBets.reduce((sum, bet) => sum + bet.amount, 0);

      if (lockedCurrentGame.lobby.rouletteMaxBet < previousBetsTotal + currentUserBetsTotal) {
        throw new ServiceError('Unable to double bets. Table Max Bet exceeded');
      }

      await this.userService.updateBalance(userId, -previousBetsTotal, manager, {
        logType: BalanceLogType.BET_PLACED,
        gameId: lockedCurrentGame.id,
        gameType: 'roulette',
        lobbyId: lockedCurrentGame.lobbyId,
        reason: 'Re-bet from previous game',
      });

      const currentGameBets: RouletteBet[] = [];

      const lastBet = await manager.getRepository(RouletteBet).findOne({
        where: { user: { id: userId }, game: { id: lockedCurrentGame.id } },
        order: { version: 'DESC' },
      });

      for (const bet of previousBets) {
        const newBet = manager.getRepository(RouletteBet).create({
          amount: bet.amount,
          betPlace: bet.betPlace,
          version: lastBet ? lastBet.version + 1 : 0,
          game: { id: lockedCurrentGame.id },
          user: bet.user,
        });

        currentGameBets.push(newBet);
      }

      await manager.getRepository(RouletteBet).save(currentGameBets);
      this.dispatcher.emitRouletteMultipleBetsPlaced(userId, lockedCurrentGame.lobbyId, currentGameBets);
    });
  }

  async handleX2Bets(userId: string, lobbyId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const game = await manager.getRepository(RouletteGame).findOne({
        where: { lobby: { id: lobbyId }, isCurrent: true },
        relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
      });

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== RouletteGameStatus.WAITING_BETS && game.status !== RouletteGameStatus.COUNTDOWN) {
        throw new ServiceError('Betting is not available at the moment');
      }

      const locked = await manager
        .createQueryBuilder(RouletteGame, 'game')
        .where('game.id = :gameId', { gameId: game.id })
        .andWhere('game.is_current = :isCurrent', { isCurrent: true })
        .setLock('pessimistic_write')
        .getOne();

      if (!locked) {
        throw new ServiceError('Current game not found or no longer active');
      }

      const lastBet = await manager.getRepository(RouletteBet).findOne({
        where: { user: { id: userId }, game: { id: game.id } },
        order: { version: 'DESC' },
      });

      if (!lastBet) return;

      const userBets = await manager.getRepository(RouletteBet).find({
        where: { user: { id: userId }, game: { id: game.id } },
        relations: ['user'],
      });

      const userBetsTotal = userBets.reduce((sum, bet) => sum + bet.amount, 0);

      if (game.lobby.rouletteMaxBet < userBetsTotal * 2) {
        throw new ServiceError('Unable to double bets. Table Max Bet exceeded');
      }

      await this.userService.updateBalance(userId, -userBetsTotal, manager, {
        logType: BalanceLogType.BET_PLACED,
        gameId: game.id,
        gameType: 'roulette',
        lobbyId: game.lobbyId,
        reason: 'Double all bets',
      });

      const currentGameBets: RouletteBet[] = [];
      for (const bet of userBets) {
        const newBet = manager.getRepository(RouletteBet).create({
          amount: bet.amount,
          betPlace: bet.betPlace,
          version: lastBet.version + 1,
          game: { id: game.id },
          user: bet.user,
        });

        currentGameBets.push(newBet);
      }

      await manager.getRepository(RouletteBet).save(currentGameBets);
      this.dispatcher.emitRouletteMultipleBetsPlaced(userId, game.lobbyId, currentGameBets);
    });
  }

  async handleUndoBet(userId: string, lobbyId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const game = await manager.getRepository(RouletteGame).findOne({
        where: { lobby: { id: lobbyId }, isCurrent: true },
        relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
      });

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== RouletteGameStatus.WAITING_BETS && game.status !== RouletteGameStatus.COUNTDOWN) {
        throw new ServiceError('Betting is not available at the moment');
      }

      const locked = await manager
        .createQueryBuilder(RouletteGame, 'game')
        .where('game.id = :gameId', { gameId: game.id })
        .andWhere('game.is_current = :isCurrent', { isCurrent: true })
        .setLock('pessimistic_write')
        .getOne();

      if (!locked) {
        throw new ServiceError('Current game not found or no longer active');
      }

      const lastBet = await manager.getRepository(RouletteBet).findOne({
        where: { user: { id: userId }, game: { id: game.id } },
        order: { version: 'DESC' },
      });

      if (!lastBet) return;

      const lastBets = await manager.getRepository(RouletteBet).find({
        where: { user: { id: userId }, game: { id: game.id }, version: lastBet.version },
        relations: ['user'],
      });

      if (lastBets.length === 0) return;

      const undoAmount = lastBets.reduce((sum, bet) => sum + bet.amount, 0);

      this.dispatcher.emitRouletteUndoBets(userId, game.lobbyId, lastBets);

      await manager.getRepository(RouletteBet).remove(lastBets);
      await this.userService.updateBalance(userId, undoAmount, manager, {
        logType: BalanceLogType.GAME_PAYOUT,
        gameId: game.id,
        gameType: 'roulette',
        lobbyId: game.lobbyId,
        reason: 'Bet refunded - undo last bet',
      });
    });
  }

  async handleClearBets(userId: string, lobbyId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const game = await manager.getRepository(RouletteGame).findOne({
        where: { lobby: { id: lobbyId }, isCurrent: true },
        relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
      });

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== RouletteGameStatus.WAITING_BETS && game.status !== RouletteGameStatus.COUNTDOWN) {
        throw new ServiceError('Betting is not available at the moment');
      }

      const locked = await manager
        .createQueryBuilder(RouletteGame, 'game')
        .where('game.id = :gameId', { gameId: game.id })
        .andWhere('game.is_current = :isCurrent', { isCurrent: true })
        .setLock('pessimistic_write')
        .getOne();

      if (!locked) {
        throw new ServiceError('Current game not found or no longer active');
      }

      const userBets = await manager.getRepository(RouletteBet).find({
        where: { user: { id: userId }, game: { id: game.id } },
        relations: ['user'],
      });

      if (userBets.length === 0) return;

      const undoAmount = userBets.reduce((sum, bet) => sum + bet.amount, 0);

      this.dispatcher.emitRouletteUndoBets(userId, game.lobbyId, userBets);

      await manager.getRepository(RouletteBet).remove(userBets);
      await this.userService.updateBalance(userId, undoAmount, manager, {
        logType: BalanceLogType.GAME_PAYOUT,
        gameId: game.id,
        gameType: 'roulette',
        lobbyId: game.lobbyId,
        reason: 'Bet refunded - clear all bets',
      });
    });
  }

  async handlePayouts(game: RouletteGame): Promise<void> {
    Logger.debug(
      `Processing payouts for game ${game.id} in lobby ${game.lobbyId}, result: ${game.result}, total bets: ${game.bets.length}`,
      'RouletteService',
    );

    try {
      const wonBets: RouletteBet[] = [];
      const userPayouts: Map<string, number> = new Map();

      for (const bet of game.bets) {
        const coveredNumbers = betPlaceToNumbers[bet.betPlace] ?? [];

        if (coveredNumbers.includes(game.result)) {
          const multiplier = mapPayoutMultiplier(bet.betPlace);
          bet.wonAmount = bet.amount * multiplier;
          bet.profitAmount = bet.wonAmount - bet.amount;
          wonBets.push(bet);

          const current = userPayouts.get(bet.userId) ?? 0;
          userPayouts.set(bet.userId, current + bet.wonAmount);
        } else {
          await this.rouletteBetRepository.update({ id: bet.id }, { profitAmount: -bet.amount });
        }
      }

      const betsInTotal = game.bets.reduce((sum, bet) => sum + bet.amount, 0);
      const wonBetsInTotal = wonBets.reduce((sum, bet) => sum + bet.wonAmount, 0);

      Logger.debug(
        `Payout calculation - Game ${game.id}: ${wonBets.length} winning bets, total wagered: $${betsInTotal}, total won: $${wonBetsInTotal}`,
        'RouletteService',
      );

      await this.dataSource.transaction(async (manager) => {
        const usersProfitInTotal = wonBetsInTotal - betsInTotal;
        const isLobbyDrained = game.lobby.rouletteBankroll < usersProfitInTotal;

        if (isLobbyDrained) {
          Logger.warn(
            `Lobby bankroll drained for game ${game.id} in lobby ${game.lobbyId} - bankroll: $${game.lobby.rouletteBankroll}, required: $${usersProfitInTotal}`,
            'RouletteService',
          );
        }

        await this.lobbyService.updateRouletteBankroll(game.lobbyId, betsInTotal - wonBetsInTotal, manager, {
          gameId: game?.id,
          reason: `Resolve player payouts - ${betsInTotal - wonBetsInTotal <= 0 ? 'PLAYER WON' : 'PLAYER LOST'}`,
          logType: TransactionType.GAME_BET_RESULT,
        });

        await this.updateGameStats(
          game.lobbyId,
          game.id,
          betsInTotal,
          isLobbyDrained ? -game.lobby.rouletteBankroll : -usersProfitInTotal,
          manager,
        );

        if (wonBets.length > 0) {
          await manager.getRepository(RouletteBet).save(wonBets);
          const lobbyPayoutProportional = isLobbyDrained ? game.lobby.rouletteBankroll / wonBetsInTotal : 1;

          for (const [userId, amount] of userPayouts) {
            await this.userService.updateBalance(userId, amount * lobbyPayoutProportional, manager, {
              logType: BalanceLogType.GAME_PAYOUT,
              gameId: game.id,
              gameType: 'roulette',
              lobbyId: game.lobbyId,
              reason: `Won roulette bet (number: ${game.result})`,
            });
          }

          Logger.log(
            `Payouts completed for game ${game.id}: ${wonBets.length} winning bets, $${wonBetsInTotal} paid out${
              isLobbyDrained ? ' (proportional due to drained bankroll)' : ''
            }`,
            'RouletteService',
          );
        } else {
          Logger.debug(`No winning bets for game ${game.id}`, 'RouletteService');
        }
      });
    } catch (error) {
      Logger.error(
        `Payout processing failed for game ${game.id} in lobby ${game.lobbyId}: ${(error as Error).message}`,
        (error as Error).stack,
        'RouletteService',
      );
      throw error;
    }
  }

  async getCurrentGameAndEmit(lobbyId: string): Promise<void> {
    let game = await this.rouletteGameRepository.findOne({
      where: { lobby: { id: lobbyId }, isCurrent: true },
      relations: ['lobby', 'lobby.owner', 'bets', 'bets.user'],
    });
    if (!game) return;

    if (game.status === RouletteGameStatus.COUNTDOWN && game.bets.length <= 0) {
      game.status = RouletteGameStatus.WAITING_BETS;
      game.timerDeadline = null;
      game.timerType = null;
      game = await this.rouletteGameRepository.save(game);
    }
    this.dispatcher.emitRouletteGameUpdate(game);

    const maxWinTableWarning = this.calculateGroupedBets(game.bets, game.lobby.rouletteBankroll);
    this.dispatcher.emitRouletteMaxWinWarning(game.lobbyId, maxWinTableWarning);
  }

  async updateGameStats(
    lobbyId: string,
    gameId: string,
    totalBetAmount: number,
    profitAmount: number,
    manager: EntityManager,
  ) {
    await manager
      .getRepository(RouletteGame)
      .createQueryBuilder()
      .update()
      .set({
        profitAmount: () => `profit_amount + ${profitAmount}`,
        wagered: () => `wagered + ${totalBetAmount}`,
      })
      .where('id = :id', { id: gameId })
      .execute();

    await this.lobbyService.updateLobbyRouletteStats(lobbyId, totalBetAmount, profitAmount, manager);
  }

  async findStuckRouletteGames(): Promise<{
    stuckPlayingGames: RouletteGame[];
    stuckBettingGames: RouletteGame[];
    stuckFinishedGames: RouletteGame[];
  }> {
    const minuteAgo = new Date();
    minuteAgo.setMinutes(minuteAgo.getMinutes() - 1);

    const stuckPlayingGames = await this.rouletteGameRepository.find({
      where: {
        status: RouletteGameStatus.PLAYING,
        updatedAt: LessThan(minuteAgo),
      },
      relations: ['bets'],
    });

    const stuckBettingGames = await this.rouletteGameRepository.find({
      where: {
        status: RouletteGameStatus.COUNTDOWN,
        updatedAt: LessThan(minuteAgo),
      },
      relations: ['bets'],
    });

    const stuckFinishedGames = await this.rouletteGameRepository.find({
      where: {
        status: RouletteGameStatus.FINISHED,
        updatedAt: LessThan(minuteAgo),
        isCurrent: true,
      },
      relations: ['bets'],
    });

    return { stuckPlayingGames, stuckBettingGames, stuckFinishedGames };
  }

  /**
   * Aggregates bets by user and bet place to reduce payload size
   * Combines multiple bets from the same user on the same bet place into a single entry
   */
  aggregateBets(bets: RouletteBet[]): RouletteAggregatedBetDTO[] {
    const aggregated = bets.reduce(
      (acc, bet) => {
        const key = `${bet.userId}-${bet.betPlace}`;
        if (!acc[key]) {
          acc[key] = {
            userId: bet.userId,
            username: bet.user.username,
            betPlace: bet.betPlace,
            amount: 0,
            betCount: 0,
          };
        }
        acc[key].amount += bet.amount;
        acc[key].betCount += 1;
        return acc;
      },
      {} as Record<
        string,
        { userId: string; username: string; betPlace: RouletteBetPlace; amount: number; betCount: number }
      >,
    );

    return Object.values(aggregated).map(
      (agg) => new RouletteAggregatedBetDTO(agg.userId, agg.username, agg.betPlace, agg.amount, agg.betCount),
    );
  }

  /**
   * Emits aggregated bet list update to all clients in the lobby
   */
  async emitAggregatedBetsUpdate(lobbyId: string): Promise<void> {
    const game = await this.getActiveGame(lobbyId);
    if (!game) return;

    const aggregatedBets = this.aggregateBets(game.bets);
    this.dispatcher.emitRouletteBetsUpdate(lobbyId, aggregatedBets);
  }

  private delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
}
