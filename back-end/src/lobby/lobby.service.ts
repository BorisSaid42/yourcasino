import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { BlackjackPlayer } from 'src/blackjack-player/blackjack-player.entity';
import { MaintenanceType } from 'src/maintenance/maintenance.entity';
import { MaintenanceService } from 'src/maintenance/maintenance.service';
import { RouletteBet } from 'src/roulette/roulette-bet.entity';
import { DataSource, EntityManager, ILike, LessThan, Repository, SelectQueryBuilder } from 'typeorm';
import { BlackjackGame, BlackjackGameStatus } from '../blackjack/blackjack-game.entity';
import { ServiceError } from '../common/service.error';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { RouletteGame, RouletteGameStatus } from '../roulette/roulette-game.entity';
import { SocketDispatcher } from '../socket/dispatcher/dispatcher';
import { TransactionType } from '../transaction/lobby/lobby-transaction.entity';
import { LobbyTransactionService } from '../transaction/lobby/lobby-transaction.service';
import { BalanceLogType } from '../user/user-balance-log.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AddBankrollActionEnum, AddBankrollDTO } from './dto/add-bankroll.dto';
import { CreateLobbyDTO } from './dto/create-lobby.dto';
import { EditLobbyDTO } from './dto/edit-lobby.dto';
import { GameType } from './dto/lobby-game.dto';
import { LobbyDataDTO, LobbyListDTO } from './dto/lobby-list.dto';
import { LobbyFilterField, LobbyQueryDTO, LobbySortField } from './dto/lobby-query.dto';
import { LobbyStatsDTO, LobbyStatsPaginatedDTO } from './dto/lobby-stats-paginated.dto';
import { LobbyBankrollChangeContext } from './lobby-bankroll-change-context';
import { Lobby, LobbyState } from './lobby.entity';

@Injectable()
export class LobbyService {
  private readonly logger = new Logger(LobbyService.name);

  constructor(
    @InjectRepository(Lobby) private readonly lobbyRepository: Repository<Lobby>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly dispatcher: SocketDispatcher,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly maintenanceService: MaintenanceService,
    private readonly lobbyTransactionService: LobbyTransactionService,
  ) {}

  async getLobbies({
    cursor,
    cursorId,
    search = '',
    sort = LobbySortField.BANKROLL,
    limit = 5,
    filter = undefined,
  }: LobbyQueryDTO): Promise<LobbyListDTO> {
    const buildWhereConditions = (qb: SelectQueryBuilder<Lobby>) => {
      qb.where('lobby.isPrivate = false')
        .andWhere('lobby.status <> :status', { status: LobbyState.INACTIVE })
        .leftJoinAndSelect('lobby.owner', 'owner')
        .select([
          'lobby.id AS "id"',
          'lobby.name AS "name"',
          'lobby.code AS "code"',
          'lobby.inviteLink AS "inviteLink"',
          'lobby.isBlackjackEnabled AS "isBlackjackEnabled"',
          'lobby.minBet AS "minBet"',
          'lobby.maxBet AS "maxBet"',
          'lobby.bankroll AS "bankroll"',
          'lobby.isRouletteEnabled AS "isRouletteEnabled"',
          'lobby.rouletteMinBet AS "rouletteMinBet"',
          'lobby.rouletteMaxBet AS "rouletteMaxBet"',
          'lobby.rouletteBankroll AS "rouletteBankroll"',
          'lobby.status AS "status"',
          'owner.username AS owner',
          '(lobby.bankroll + lobby.rouletteBankroll) AS "summedBankroll"',
        ])
        .addSelect(
          (subQuery) =>
            subQuery
              .select('COUNT(bp.id)')
              .from(BlackjackPlayer, 'bp')
              .leftJoin('bp.game', 'bg')
              .where('bg.lobby_id = lobby.id')
              .andWhere('bg.isCurrent = true'),
          'currentPlayerCount',
        )
        .addSelect(
          (subQuery) =>
            subQuery
              .select('COUNT(DISTINCT(bet.user_id))')
              .from(RouletteBet, 'bet')
              .leftJoin('bet.game', 'game')
              .where('game.lobby_id = lobby.id')
              .andWhere('game.isCurrent = true'),
          'roulettePlayerCount',
        )
        .groupBy('lobby.id')
        .addGroupBy('owner.id');

      if (search) {
        const lowered = `%${search.toLowerCase()}%`;
        qb.andWhere(
          '(LOWER(lobby.name) LIKE :search OR LOWER(owner.username) LIKE :search OR LOWER(lobby.code) LIKE :search)',
          { search: lowered },
        );
      }

      if (filter) {
        const roulette = filter.includes(LobbyFilterField.ROULETTE_ONLY);
        const blackjack = filter.includes(LobbyFilterField.BLACKJACK_ONLY);
        const openSlots = filter.includes(LobbyFilterField.OPEN_SLOTS);

        if (roulette || blackjack) {
          qb.andWhere('lobby.isRouletteEnabled = :roulette', { roulette }).andWhere(
            'lobby.isBlackjackEnabled = :blackjack',
            { blackjack },
          );
        }

        if (openSlots && blackjack) {
          qb.andWhere((qb1) => {
            const subQuery = qb1
              .subQuery()
              .select('COUNT(bp.id)')
              .from(BlackjackPlayer, 'bp')
              .leftJoin('bp.game', 'bg')
              .where('bg.lobby_id = lobby.id')
              .andWhere('bg.isCurrent = true')
              .getQuery();

            return `${subQuery} < lobby.maxSeats`;
          });
        }
      }

      if (cursor && cursorId) {
        const isAsc = sort === LobbySortField.MIN_BET;
        const operator = isAsc ? '>' : '<';

        qb.andWhere(
          `(lobby.${sort} ${operator} :cursor OR (lobby.${sort} = :cursor AND lobby.id ${operator} :cursorId))`,
          { cursor, cursorId },
        );
      }

      return qb;
    };

    const [data, total, totalPrivate] = await Promise.all([
      buildWhereConditions(this.lobbyRepository.createQueryBuilder('lobby'))
        .orderBy(
          sort === LobbySortField.BANKROLL ? '(lobby.bankroll + lobby.rouletteBankroll)' : `lobby.${sort}`,
          sort === LobbySortField.MIN_BET ? 'ASC' : 'DESC',
        )
        .limit(limit)
        .getRawMany<LobbyDataDTO>(),

      buildWhereConditions(this.lobbyRepository.createQueryBuilder('lobby')).getCount(),

      this.lobbyRepository.count({ where: { isPrivate: true } }),
    ]);

    return new LobbyListDTO(
      data.map((lobbyData) => new LobbyDataDTO(lobbyData)),
      total,
      totalPrivate,
    );
  }

  async getLobbyStats(userId: string, page = 1, limit = 10): Promise<LobbyStatsPaginatedDTO> {
    const offset = (page - 1) * limit;

    const qb = this.lobbyRepository
      .createQueryBuilder('lobby')
      .leftJoin('lobby.owner', 'owner')
      .leftJoin('lobby.blackjackGames', 'game')
      .leftJoin('game.players', 'player')
      .leftJoin('player.bets', 'bet')
      .where('owner.id = :userId', { userId })
      .andWhere('lobby.status <> :status', { status: LobbyState.INACTIVE })
      .select([
        'lobby.id AS "id"',
        'lobby.status AS "status"',
        'lobby.name AS "name"',
        'lobby.code AS "code"',
        'lobby.inviteLink AS "inviteLink"',
        'lobby.minBet AS "minBet"',
        'lobby.maxBet AS "maxBet"',
        '(lobby.bankroll + lobby.roulette_bankroll) AS "bankroll"',
        'COALESCE(SUM(bet.amount - bet.wonAmount), 0) AS "netProfit"',
        `
        CASE
          WHEN (lobby.bankroll + lobby.roulette_bankroll) > 0
            THEN ROUND((COALESCE(SUM(bet.amount - bet.wonAmount), 0) / (lobby.bankroll + lobby.roulette_bankroll) * 100)::numeric, 2)
          ELSE 0
        END AS "profitPercentage"
        `,
      ])
      .groupBy('lobby.id')
      .orderBy('(lobby.bankroll + lobby.roulette_bankroll)', 'DESC')
      .limit(limit)
      .offset(offset);

    const results = await qb.getRawMany<LobbyStatsDTO>();

    const total = await this.lobbyRepository
      .createQueryBuilder('lobby')
      .leftJoin('lobby.owner', 'owner')
      .where('owner.id = :userId', { userId })
      .andWhere('lobby.status <> :status', { status: LobbyState.INACTIVE })
      .getCount();

    const totalPages = Math.ceil(total / limit);

    return new LobbyStatsPaginatedDTO({
      data: results.map((data) => new LobbyStatsDTO(data)),
      page,
      totalPages,
      total,
    });
  }

  public async getAllUserLobbies(ownerId: string): Promise<Lobby[] | null> {
    return await this.lobbyRepository.find({ where: { ownerId } });
  }

  public async getLobbyById(lobbyId: string): Promise<Lobby | null> {
    return await this.lobbyRepository.findOne({ where: { id: lobbyId }, relations: ['owner'] });
  }

  public async getLobbyByCode(code: string): Promise<Lobby | null> {
    return await this.lobbyRepository.findOne({
      where: { code: ILike(code) },
      relations: ['owner'],
    });
  }

  public async getInsufficientLobbies(): Promise<Lobby[]> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return await this.lobbyRepository.find({
      where: {
        bankroll: LessThan(0.5),
        rouletteBankroll: LessThan(0.5),
        updatedAt: LessThan(twentyFourHoursAgo),
      },
    });
  }

  public async save(lobbies: Lobby[]): Promise<void> {
    await this.lobbyRepository.save(lobbies);
  }

  public async addBankroll(
    lobbyId: string,
    payload: AddBankrollDTO,
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    if (await this.maintenanceService.isInMaintenance([MaintenanceType.FULL, MaintenanceType.PAUSE])) {
      throw new ServiceError('Adding funds to the bankroll has been paused.');
    }

    if (
      payload.game === GameType.BLACKJACK &&
      (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_BLACKJACK))
    ) {
      throw new ServiceError('Adding funds to the Blackjack bankroll has been paused.');
    }

    if (
      payload.game === GameType.ROULETTE &&
      (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_ROULETTE))
    ) {
      throw new ServiceError('Adding funds to the Roulette bankroll has been paused.');
    }

    const run = async (m: EntityManager) => {
      const user = await m.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new ServiceError('User not found');
      }

      const lobby = await m.findOne(Lobby, {
        where: { id: lobbyId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lobby) {
        throw new ServiceError('Lobby not found');
      }

      if (lobby.ownerId !== user.id) {
        throw new ServiceError('Forbidden');
      }

      if (payload.action === AddBankrollActionEnum.ADD && user.balance < payload.bankroll) {
        throw new ServiceError('Insufficient user balance');
      }

      if (
        payload.game === GameType.BLACKJACK &&
        payload.action === AddBankrollActionEnum.WITHDRAW &&
        lobby.bankroll < payload.bankroll
      ) {
        throw new ServiceError('Insufficient bankroll balance');
      }

      if (
        payload.game === GameType.ROULETTE &&
        payload.action === AddBankrollActionEnum.WITHDRAW &&
        lobby.rouletteBankroll < payload.bankroll
      ) {
        throw new ServiceError('Insufficient bankroll balance');
      }

      if (payload.game === GameType.BLACKJACK) {
        const currentGame = await m.findOne(BlackjackGame, {
          where: { lobby: { id: lobbyId }, isCurrent: true },
          lock: { mode: 'pessimistic_write' },
        });

        if (
          currentGame &&
          currentGame.status !== BlackjackGameStatus.WAITING_PLAYERS &&
          currentGame.status !== BlackjackGameStatus.WAITING_BETS
        ) {
          throw new ServiceError("You can't change the lobby blackjack bankroll while game is in progress");
        }

        let userBankrollAmount = payload.bankroll;
        let isProfitWithdraw = false;
        if (payload.action === AddBankrollActionEnum.WITHDRAW && lobby.blackjackProfitAmount > 0) {
          isProfitWithdraw = true;
          if (lobby.blackjackProfitAmount > payload.bankroll) {
            userBankrollAmount = payload.bankroll - payload.bankroll * 0.05;
            await m.update(
              Lobby,
              { id: lobby.id },
              { blackjackProfitAmount: lobby.blackjackProfitAmount - payload.bankroll },
            );
          } else {
            userBankrollAmount = payload.bankroll - lobby.blackjackProfitAmount * 0.05;
            await m.update(Lobby, { id: lobby.id }, { blackjackProfitAmount: 0 });
          }

          const houseProfitAmount = payload.bankroll - userBankrollAmount;

          if (houseProfitAmount > 0) {
            await this.lobbyTransactionService.logTransaction(
              lobbyId,
              TransactionType.WITHDRAW_HOUSE_PROFIT,
              GameType.BLACKJACK,
              houseProfitAmount,
              m,
            );
          }
        }

        await this.updateBankroll(
          lobbyId,
          payload.action === AddBankrollActionEnum.ADD ? payload.bankroll : -payload.bankroll,
          m,
          {
            gameId: currentGame?.id,
            reason: 'Add to bankroll',
            logType:
              payload.action === AddBankrollActionEnum.ADD
                ? TransactionType.ADD_BALANCE
                : TransactionType.WITHDRAW_BALANCE,
          },
        );

        await this.userService.updateBalance(
          userId,
          payload.action === AddBankrollActionEnum.ADD ? -payload.bankroll : userBankrollAmount,
          m,
          {
            logType:
              payload.action === AddBankrollActionEnum.ADD
                ? BalanceLogType.LOBBY_DEPOSIT
                : isProfitWithdraw
                  ? BalanceLogType.LOBBY_PROFIT_WITHDRAW
                  : BalanceLogType.LOBBY_WITHDRAW,
            lobbyId,
            gameType: GameType.BLACKJACK,
            reason:
              payload.action === AddBankrollActionEnum.ADD ? 'Added to lobby bankroll' : 'Withdrew from lobby bankroll',
          },
        );
      } else {
        const currentGame = await m.findOne(RouletteGame, {
          where: { lobby: { id: lobbyId }, isCurrent: true },
          lock: { mode: 'pessimistic_write' },
        });

        if (
          currentGame &&
          (currentGame.status === RouletteGameStatus.PLAYING || currentGame.status === RouletteGameStatus.COUNTDOWN)
        ) {
          throw new ServiceError("You can't change the lobby roulette bankroll while game is in progress");
        }

        let userBankrollAmount = payload.bankroll;
        let isProfitWithdraw = false;
        if (payload.action === AddBankrollActionEnum.WITHDRAW && lobby.rouletteProfitAmount > 0) {
          isProfitWithdraw = true;
          if (lobby.rouletteProfitAmount > payload.bankroll) {
            userBankrollAmount = payload.bankroll - payload.bankroll * 0.05;
            await m.update(
              Lobby,
              { id: lobby.id },
              { rouletteProfitAmount: lobby.rouletteProfitAmount - payload.bankroll },
            );
          } else {
            userBankrollAmount = payload.bankroll - lobby.rouletteProfitAmount * 0.05;
            await m.update(Lobby, { id: lobby.id }, { rouletteProfitAmount: 0 });
          }

          const houseProfitAmount = payload.bankroll - userBankrollAmount;

          if (houseProfitAmount > 0) {
            await this.lobbyTransactionService.logTransaction(
              lobbyId,
              TransactionType.WITHDRAW_HOUSE_PROFIT,
              GameType.ROULETTE,
              houseProfitAmount,
              m,
            );
          }
        }

        await this.updateRouletteBankroll(
          lobbyId,
          payload.action === AddBankrollActionEnum.ADD ? payload.bankroll : -payload.bankroll,
          m,
          {
            gameId: currentGame?.id,
            reason: 'Add to roulette bankroll',
            logType:
              payload.action === AddBankrollActionEnum.ADD
                ? TransactionType.ADD_BALANCE
                : TransactionType.WITHDRAW_BALANCE,
          },
        );

        await this.userService.updateBalance(
          userId,
          payload.action === AddBankrollActionEnum.ADD ? -payload.bankroll : userBankrollAmount,
          m,
          {
            logType:
              payload.action === AddBankrollActionEnum.ADD
                ? BalanceLogType.LOBBY_DEPOSIT
                : isProfitWithdraw
                  ? BalanceLogType.LOBBY_PROFIT_WITHDRAW
                  : BalanceLogType.LOBBY_WITHDRAW,
            lobbyId,
            gameType: GameType.ROULETTE,
            reason:
              payload.action === AddBankrollActionEnum.ADD ? 'Added to lobby bankroll' : 'Withdrew from lobby bankroll',
          },
        );
      }
    };

    if (manager) return run(manager);
    return this.dataSource.transaction(run);
  }

  async updateBankroll(
    lobbyId: string,
    amount: number,
    manager?: EntityManager,
    context?: LobbyBankrollChangeContext,
  ): Promise<void> {
    const run = async (m: EntityManager) => {
      const lobby = await m.findOne(Lobby, {
        where: { id: lobbyId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lobby) {
        throw new ServiceError('Lobby not found');
      }

      const oldBalance = lobby.bankroll;
      const newBalance = lobby.bankroll + amount;

      if (newBalance < 0) {
        throw new ServiceError(
          `Lobby ${lobbyId} bankroll would go negative (have ${oldBalance}, requested change ${amount})`,
        );
      }

      lobby.bankroll = newBalance;
      await m.save(lobby);

      if (oldBalance !== newBalance) {
        this.logger.log(
          `Lobby (${lobbyId}) Bankroll ${newBalance > oldBalance ? 'INCREASED' : 'DECREASED'}, ${oldBalance} -> ${newBalance} ${context?.gameId ? `, Game: ${context.gameId}` : ''} ${context?.reason ? `, Reason: ${context.reason}` : ''}`,
        );

        if (context?.logType) {
          await this.lobbyTransactionService.logTransaction(lobbyId, context?.logType, GameType.BLACKJACK, amount, m);
        }
      } else {
        this.logger.log(`Lobby (${lobbyId}) Bankroll update called -> No changes`);
      }

      this.dispatcher.emitLobbyBankrollUpdate(lobby.id, lobby.bankroll);
    };

    if (manager) return run(manager);
    return this.dataSource.transaction(run);
  }

  async updateLobbyBlackjackStats(lobbyId: string, totalBetAmount: number, profitAmount: number) {
    await this.lobbyRepository
      .createQueryBuilder()
      .update()
      .set({
        blackjackProfitAmount: () => `blackjack_profit_amount + ${profitAmount}`,
        blackjackWagered: () => `blackjack_wagered + ${totalBetAmount}`,
      })
      .where('id = :id', { id: lobbyId })
      .execute();
  }

  async updateLobbyRouletteStats(
    lobbyId: string,
    totalBetAmount: number,
    profitAmount: number,
    manager: EntityManager,
  ) {
    await manager
      .getRepository(Lobby)
      .createQueryBuilder()
      .update()
      .set({
        rouletteProfitAmount: () => `roulette_profit_amount + ${profitAmount}`,
        rouletteWagered: () => `roulette_wagered + ${totalBetAmount}`,
      })
      .where('id = :id', { id: lobbyId })
      .execute();
  }

  async updateRouletteBankroll(
    lobbyId: string,
    amount: number,
    manager?: EntityManager,
    context?: LobbyBankrollChangeContext,
  ): Promise<void> {
    const run = async (m: EntityManager) => {
      const lobby = await m.findOne(Lobby, {
        where: { id: lobbyId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lobby) {
        throw new ServiceError('Lobby not found');
      }

      const oldBalance = lobby.rouletteBankroll;
      const newBalance = lobby.rouletteBankroll + amount;

      if (newBalance < 0) {
        throw new ServiceError(
          `Lobby ${lobbyId} roulette bankroll would go negative (have ${oldBalance}, requested change ${amount})`,
        );
      }

      lobby.rouletteBankroll = newBalance;
      await m.save(lobby);

      if (oldBalance !== newBalance) {
        this.logger.log(
          `Lobby (${lobbyId}) Roulette Bankroll ${newBalance > oldBalance ? 'INCREASED' : 'DECREASED'}, ${oldBalance} -> ${newBalance} ${context?.gameId ? `, Game: ${context.gameId}` : ''} ${context?.reason ? `, Reason: ${context.reason}` : ''}`,
        );

        if (context?.logType) {
          await this.lobbyTransactionService.logTransaction(lobbyId, context?.logType, GameType.ROULETTE, amount, m);
        }
      } else {
        this.logger.log(`Lobby (${lobbyId}) Roulette Bankroll update called -> No changes`);
      }

      this.dispatcher.emitRouletteBankrollUpdate(lobby.id, lobby.rouletteBankroll);
    };

    if (manager) return run(manager);
    return this.dataSource.transaction(run);
  }

  public async createLobby(body: CreateLobbyDTO, userId: string): Promise<Lobby> {
    if (await this.maintenanceService.isInMaintenance([MaintenanceType.FULL, MaintenanceType.PAUSE])) {
      throw new ServiceError('Creating a new lobby has been paused');
    }

    if (body.isBlackjackSelected && (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_BLACKJACK))) {
      throw new ServiceError('Creating a new Blackjack lobby has been paused');
    }

    if (body.isRouletteSelected && (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_ROULETTE))) {
      throw new ServiceError('Creating a new Roulette lobby has been paused');
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new ServiceError('Could not find user');
    }

    if (!body.isBlackjackSelected && !body.isRouletteSelected) {
      throw new ServiceError('At least one game needs to be enabled for lobby to be created');
    }

    let bankrollsSum = 0;

    if (!body.isBlackjackSelected && (body.bankroll || body.minBet || body.maxBet)) {
      throw new BadRequestException('Cannot set blackjack parameters when blackjack is not selected');
    }

    if (!body.isRouletteSelected && (body.rouletteBankroll || body.rouletteMinBet || body.rouletteMaxBet)) {
      throw new BadRequestException('Cannot set roulette parameters when roulette is not selected');
    }

    if (body.isBlackjackSelected) {
      if (body.maxBet < body.minBet) {
        throw new ServiceError('Max Bet must be higher than Min Bet');
      }

      if (body.bankroll < body.maxBet) {
        throw new ServiceError('Max Bet can not be higher than Bankroll');
      }

      bankrollsSum += body.bankroll;
    }

    if (body.isRouletteSelected) {
      if (body.rouletteMaxBet < body.rouletteMinBet) {
        throw new ServiceError('Roulette Max Bet must be higher than Roulette Min Bet');
      }

      if (body.rouletteBankroll < body.rouletteMaxBet) {
        throw new ServiceError('Roulette Max Bet can not be higher than Roulette Bankroll');
      }

      bankrollsSum += body.rouletteBankroll;
    }

    if (user.balance < bankrollsSum) {
      throw new ServiceError('Insufficient balance. Bankroll higher then balance');
    }

    const lobbyExist = await this.getLobbyByCode(body.code);

    if (lobbyExist) {
      throw new ServiceError(`Lobby with code "${body.code}" already exist`);
    }

    let lobbyName = '';
    if (body.isBlackjackSelected && body.isRouletteSelected) {
      lobbyName = 'Blackjack & Roulette';
    } else if (body.isBlackjackSelected) {
      lobbyName = 'Blackjack';
    } else if (body.isRouletteSelected) {
      lobbyName = 'Roulette';
    }

    const inviteLink = `${this.configService.getAppUrl()}/lobby/${body.code}`;

    const savedLobby = await this.dataSource.transaction(async (manager) => {
      const lobby = manager.getRepository(Lobby).create({
        name: lobbyName,
        isBlackjackEnabled: body.isBlackjackSelected,
        bankroll: body.bankroll ?? 0,
        minBet: body.minBet ?? 0,
        maxBet: body.maxBet ?? 0,
        isRouletteEnabled: body.isRouletteSelected,
        rouletteBankroll: body.rouletteBankroll ?? 0,
        rouletteMinBet: body.rouletteMinBet ?? 0,
        rouletteMaxBet: body.rouletteMaxBet ?? 0,
        code: body.code,
        inviteLink,
        isPrivate: body.isPrivate,
        sideBets: body.sideBets,
        status: LobbyState.ACTIVE,
        activatedAt: new Date(),
        owner: { id: user.id },
      });
      const persisted = await manager.save(lobby);

      await this.userService.updateBalance(user.id, -bankrollsSum, manager, {
        logType: BalanceLogType.LOBBY_CREATED,
        lobbyId: persisted.id,
        reason: `Created lobby "${persisted.name}" with initial bankroll`,
      });

      if (body.isBlackjackSelected && body.bankroll > 0) {
        await this.lobbyTransactionService.logTransaction(
          persisted.id,
          TransactionType.CREATED_LOBBY,
          GameType.BLACKJACK,
          body.bankroll,
          manager,
        );
      }

      if (body.isRouletteSelected && body.rouletteBankroll > 0) {
        await this.lobbyTransactionService.logTransaction(
          persisted.id,
          TransactionType.CREATED_LOBBY,
          GameType.ROULETTE,
          body.rouletteBankroll,
          manager,
        );
      }

      return persisted;
    });

    // Side effects only after the DB transaction commits. A failure here
    // (notification subsystem down, etc.) must not cascade into a refund of
    // a successfully-created lobby.
    try {
      await this.notificationService.createNotification(
        user.id,
        'Lobby Created',
        `You have created a lobby.`,
        'success_two',
        inviteLink,
      );
    } catch (notifyErr) {
      this.logger.error(
        `Failed to send lobby-created notification for ${savedLobby.id}`,
        notifyErr instanceof Error ? notifyErr.stack : String(notifyErr),
      );
    }

    return savedLobby;
  }

  public async checkRouletteData(lobbyId: string): Promise<void> {
    const lobby = await this.getLobbyById(lobbyId);

    if (!lobby?.rouletteMinBet || !lobby?.rouletteMaxBet) {
      await this.lobbyRepository.update(
        { id: lobbyId },
        { rouletteBankroll: 10000, rouletteMinBet: 0.5, rouletteMaxBet: 350 },
      );
    }
  }

  public async editLobby(lobbyId: string, body: EditLobbyDTO, userId: string): Promise<void> {
    if (await this.maintenanceService.isInMaintenance([MaintenanceType.FULL, MaintenanceType.PAUSE])) {
      throw new ServiceError('Editing a lobby has been paused');
    }

    if (body.isBlackjackSelected && (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_BLACKJACK))) {
      throw new ServiceError('Editing a Blackjack lobby has been paused');
    }

    if (body.isRouletteSelected && (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_ROULETTE))) {
      throw new ServiceError('Editing a Roulette lobby has been paused');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ServiceError('Could not find user');
    }

    if (!body.isBlackjackSelected && !body.isRouletteSelected) {
      throw new ServiceError('At least one game needs to be enabled for lobby');
    }

    if (body.maxBet < body.minBet) {
      throw new ServiceError('Max Bet must be higher than Min Bet');
    }

    let inviteLink: string;
    await this.dataSource.transaction(async (manager) => {
      const lobby = await manager.getRepository(Lobby).findOne({
        where: { id: lobbyId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lobby) {
        throw new ServiceError('Could not find lobby');
      }

      if (lobby.ownerId !== user.id) {
        throw new ServiceError('You cannot edit this lobby');
      }

      if (lobby.status === LobbyState.INACTIVE) {
        throw new ServiceError('You cannot edit this lobby. Inactive');
      }

      if (body.isBlackjackSelected && lobby.isBlackjackEnabled) {
        if (body.maxBet < body.minBet) {
          throw new ServiceError('Max Bet must be higher than Min Bet');
        }

        if (lobby.bankroll < body.maxBet) {
          throw new ServiceError(`Blackjack Max Bet can not be higher than current bankroll ($${lobby.bankroll})`);
        }
      }

      if (body.isRouletteSelected && lobby.isRouletteEnabled) {
        if (body.rouletteMaxBet < body.rouletteMinBet) {
          throw new ServiceError('Roulette Max Bet must be higher than Roulette Min Bet');
        }

        if (lobby.rouletteBankroll < body.rouletteMaxBet) {
          throw new ServiceError(
            `Roulette Max Bet can not be higher than current bankroll ($${lobby.rouletteBankroll})`,
          );
        }
      }

      let bankrollsSum = 0;

      if (!lobby.isBlackjackEnabled && body.isBlackjackSelected) {
        if (body.maxBet < body.minBet) {
          throw new ServiceError('Max Bet must be higher than Min Bet');
        }

        if (body.bankroll < body.maxBet) {
          throw new ServiceError('Max Bet can not be higher than Bankroll');
        }

        bankrollsSum += body.bankroll;
      }

      if (lobby.isBlackjackEnabled && !body.isBlackjackSelected) {
        await this.addBankroll(
          lobby.id,
          { action: AddBankrollActionEnum.WITHDRAW, bankroll: lobby.bankroll, game: GameType.BLACKJACK },
          userId,
          manager,
        );
      }

      if (!lobby.isRouletteEnabled && body.isRouletteSelected) {
        if (body.rouletteBankroll <= 0) {
          throw new ServiceError('Roulette Bankroll must be greater than 0');
        }

        if (body.rouletteMaxBet < body.rouletteMinBet) {
          throw new ServiceError('Roulette Max Bet must be higher than Roulette Min Bet');
        }

        if (body.rouletteBankroll < body.rouletteMaxBet) {
          throw new ServiceError('Roulette Max Bet can not be higher than Roulette Bankroll');
        }

        bankrollsSum += body.rouletteBankroll;
      }

      if (lobby.isRouletteEnabled && !body.isRouletteSelected) {
        await this.addBankroll(
          lobby.id,
          { action: AddBankrollActionEnum.WITHDRAW, bankroll: lobby.rouletteBankroll, game: GameType.ROULETTE },
          userId,
          manager,
        );
      }

      if (user.balance < bankrollsSum) {
        throw new ServiceError('Insufficient balance. Bankroll higher then balance');
      }

      let lobbyName = '';
      if (body.isBlackjackSelected && body.isRouletteSelected) {
        lobbyName = 'Blackjack & Roulette';
      } else if (body.isBlackjackSelected) {
        lobbyName = 'Blackjack';
      } else if (body.isRouletteSelected) {
        lobbyName = 'Roulette';
      }

      // editLobby must NOT be a backdoor for changing lobby status. Status
      // transitions go through /lobby/pause, /lobby/activate, /lobby/deactivate
      // which carry their own bankroll-refund / game-in-progress checks.
      const updatedFields: Partial<Lobby> = {
        name: lobbyName,
        bankroll:
          !lobby.isBlackjackEnabled && body.isBlackjackSelected
            ? body.bankroll
            : lobby.isBlackjackEnabled && !body.isBlackjackSelected
              ? 0
              : lobby.bankroll,
        rouletteBankroll:
          !lobby.isRouletteEnabled && body.isRouletteSelected
            ? body.rouletteBankroll
            : lobby.isRouletteEnabled && !body.isRouletteSelected
              ? 0
              : lobby.rouletteBankroll,
        isBlackjackEnabled: body.isBlackjackSelected,
        isRouletteEnabled: body.isRouletteSelected,
        isPrivate: body.isPrivate,
        sideBets: body.sideBets,
      };

      // Only overwrite blackjack min/max when blackjack is selected; same for
      // roulette. Otherwise we'd carry stale values into a lobby's disabled game.
      if (body.isBlackjackSelected) {
        updatedFields.minBet = body.minBet;
        updatedFields.maxBet = body.maxBet;
      }
      if (body.isRouletteSelected) {
        updatedFields.rouletteMinBet = body.rouletteMinBet;
        updatedFields.rouletteMaxBet = body.rouletteMaxBet;
      }

      inviteLink = lobby.inviteLink;
      await manager.getRepository(Lobby).update({ id: lobbyId }, updatedFields);

      Object.assign(lobby, updatedFields);

      this.dispatcher.emitLobbyEdited(lobbyId, updatedFields);

      if (bankrollsSum > 0) {
        await this.userService.updateBalance(user.id, -bankrollsSum, manager, {
          logType: BalanceLogType.LOBBY_DEPOSIT,
          lobbyId,
          reason: `Edited lobby — funded newly enabled game(s)`,
        });
      }
    });

    await this.notificationService.createNotification(
      user.id,
      'Lobby Edited',
      `You have edited a lobby.`,
      'success_two',
      inviteLink!,
    );
  }

  public async deactivateGame(lobbyId: string, game: GameType, userId: string): Promise<void> {
    if (await this.maintenanceService.isInMaintenance([MaintenanceType.FULL, MaintenanceType.PAUSE])) {
      throw new ServiceError('Deactivating game has been paused');
    }
    if (
      game === GameType.BLACKJACK &&
      (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_BLACKJACK))
    ) {
      throw new ServiceError('Deactivating Blackjack game has been paused');
    }
    if (game === GameType.ROULETTE && (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_ROULETTE))) {
      throw new ServiceError('Deactivating Roulette game has been paused');
    }

    const lobby = await this.getLobbyById(lobbyId);

    if (!lobby || lobby.ownerId !== userId) throw new ServiceError('Unknown lobby');

    if (lobby.status === LobbyState.INACTIVE) throw new ServiceError('Lobby is deactivated');

    if (game === GameType.BLACKJACK) {
      await this.lobbyRepository.update(
        { id: lobbyId },
        {
          isBlackjackEnabled: false,
          name: lobby.isRouletteEnabled ? 'Roulette' : lobby.name,
          status: !lobby.isRouletteEnabled ? LobbyState.INACTIVE : lobby.status,
        },
      );
    }

    if (game === GameType.ROULETTE) {
      await this.lobbyRepository.update(
        { id: lobbyId },
        {
          isRouletteEnabled: false,
          name: lobby.isBlackjackEnabled ? 'Blackjack' : lobby.name,
          status: !lobby.isBlackjackEnabled ? LobbyState.INACTIVE : lobby.status,
        },
      );
    }
  }

  public async deactivate(lobbyId: string, userId: string): Promise<void> {
    if (await this.maintenanceService.isInMaintenance([MaintenanceType.FULL, MaintenanceType.PAUSE])) {
      throw new ServiceError('Deactivating a lobby has been paused');
    }

    await this.dataSource.transaction(async (manager) => {
      const lobbyRepository = manager.getRepository(Lobby);

      const lobby = await lobbyRepository.findOne({
        where: { id: lobbyId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lobby || lobby.ownerId !== userId) {
        throw new ServiceError('Unknown lobby');
      }

      if (lobby.status === LobbyState.INACTIVE) throw new ServiceError('Lobby already deactivated');

      const currentBJGame = await manager.findOne(BlackjackGame, {
        where: { lobby: { id: lobbyId }, isCurrent: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (currentBJGame && (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_BLACKJACK))) {
        throw new ServiceError('Deactivating a Blackjack lobby has been paused');
      }

      if (
        currentBJGame &&
        (currentBJGame.status === BlackjackGameStatus.PLAYING || currentBJGame.status === BlackjackGameStatus.COUNTDOWN)
      ) {
        throw new ServiceError("Blackjack game in proYou can't pause the lobby while game is in progress");
      }

      const currentRouletteGame = await manager.findOne(RouletteGame, {
        where: { lobby: { id: lobbyId }, isCurrent: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (currentRouletteGame && (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_ROULETTE))) {
        throw new ServiceError('Deactivating a Roulette lobby has been paused');
      }

      if (
        currentRouletteGame &&
        (currentRouletteGame.status === RouletteGameStatus.PLAYING ||
          currentRouletteGame.status === RouletteGameStatus.COUNTDOWN)
      ) {
        throw new ServiceError("You can't pause the lobby while game is in progress");
      }

      if (lobby.bankroll > 0) {
        await this.addBankroll(
          lobby.id,
          { action: AddBankrollActionEnum.WITHDRAW, game: GameType.BLACKJACK, bankroll: lobby.bankroll },
          userId,
          manager,
        );
      }

      if (lobby.rouletteBankroll > 0) {
        await this.addBankroll(
          lobby.id,
          {
            action: AddBankrollActionEnum.WITHDRAW,
            game: GameType.ROULETTE,
            bankroll: lobby.rouletteBankroll,
          },
          userId,
          manager,
        );
      }

      await lobbyRepository.update({ id: lobbyId }, { status: LobbyState.INACTIVE });
      this.dispatcher.emitLobbyActiveStatusChange(lobbyId, lobby.code, LobbyState.INACTIVE);
    });
  }

  public async pause(lobbyId: string, userId: string): Promise<void> {
    if (await this.maintenanceService.isInMaintenance([MaintenanceType.FULL, MaintenanceType.PAUSE])) {
      throw new ServiceError('Pausing lobby is currently unavailable');
    }

    await this.dataSource.transaction(async (manager) => {
      const lobbyRepository = manager.getRepository(Lobby);

      const lobby = await lobbyRepository.findOne({
        where: { id: lobbyId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lobby || lobby.ownerId !== userId) {
        throw new ServiceError('Unknown lobby');
      }

      if (lobby.status === LobbyState.PAUSED) {
        throw new ServiceError('Lobby already paused');
      }

      const currentBJGame = await manager.findOne(BlackjackGame, {
        where: { lobby: { id: lobbyId }, isCurrent: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (currentBJGame && (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_BLACKJACK))) {
        throw new ServiceError('Pausing a Blackjack lobby is currently unavailable');
      }

      if (
        currentBJGame &&
        (currentBJGame.status === BlackjackGameStatus.PLAYING ||
          currentBJGame.status === BlackjackGameStatus.COUNTDOWN ||
          currentBJGame.status === BlackjackGameStatus.DEALER_PLAYING)
      ) {
        throw new ServiceError("Blackjack game in progress. You can't pause the lobby while game is in progress");
      }

      const currentRouletteGame = await manager.findOne(RouletteGame, {
        where: { lobby: { id: lobbyId }, isCurrent: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (currentRouletteGame && (await this.maintenanceService.isInMaintenance(MaintenanceType.PAUSE_ROULETTE))) {
        throw new ServiceError('Pausing a Roulette lobby is currently unavailable');
      }

      if (
        currentRouletteGame &&
        (currentRouletteGame.status === RouletteGameStatus.PLAYING ||
          currentRouletteGame.status === RouletteGameStatus.COUNTDOWN)
      ) {
        throw new ServiceError("You can't pause the lobby while game is in progress");
      }

      await lobbyRepository.update({ id: lobbyId }, { status: LobbyState.PAUSED });

      this.dispatcher.emitLobbyActiveStatusChange(lobbyId, lobby.code, LobbyState.PAUSED);
    });
  }

  public async activate(lobbyId: string, userId: string): Promise<void> {
    if (await this.maintenanceService.isInMaintenance([MaintenanceType.FULL, MaintenanceType.PAUSE])) {
      throw new ServiceError('Pausing lobby is currently unavailable');
    }

    const lobby = await this.getLobbyById(lobbyId);

    if (!lobby || lobby.ownerId !== userId) throw new ServiceError('Unknown lobby');

    if (lobby.status === LobbyState.ACTIVE) throw new ServiceError('Lobby is already active');

    if (lobby.status === LobbyState.INACTIVE)
      throw new ServiceError('Lobby is deactivated and cannot be activated again.');

    await this.lobbyRepository.update({ id: lobbyId }, { status: LobbyState.ACTIVE, activatedAt: new Date() });
    this.dispatcher.emitLobbyActiveStatusChange(lobbyId, lobby.code, LobbyState.ACTIVE);
  }
}
