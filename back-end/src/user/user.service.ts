import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TokenPayload } from 'google-auth-library';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { GoogleSignupDTO } from '../auth/dto/google-signup.dto';
import { SignupDTO } from '../auth/dto/signup-request.dto';
import { ServiceError } from '../common/service.error';
import { ConfigService } from '../config/config.service';
import { SocketDispatcher } from '../socket/dispatcher/dispatcher';
import { ProfileStatsDTO } from './dto/profile-stats.dto';
import { UserWalletDTO } from './dto/user-wallet.dto';
import { UserWallet, WalletAsset } from './user-wallet.entity';
import { User } from './user.entity';
import { UserBalanceChangeContext } from './types/user-balance-change-context';
import { UserBalanceLogService } from './user-balance-log.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserWallet) private readonly userWalletRepository: Repository<UserWallet>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly dispatcher: SocketDispatcher,
    private readonly configService: ConfigService,
    private readonly balanceLogService: UserBalanceLogService,
  ) {}

  public async getProfileStats(userId: string): Promise<ProfileStatsDTO> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .select(['user.username', 'user.createdAt', 'user.resetStatsAt'])
      .getOne();

    if (!user) throw new ServiceError('User not found');

    const { username, createdAt, resetStatsAt } = user;

    // total lobbies
    const lobbiesQb = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.lobbies', 'lobby')
      .where('user.id = :userId', { userId });

    if (resetStatsAt) {
      lobbiesQb.andWhere('lobby.createdAt >= :resetStatsAt', { resetStatsAt });
    }

    const lobbiesResult = await lobbiesQb
      .select('COUNT(DISTINCT lobby.id)', 'totalLobbies')
      .getRawOne<{ totalLobbies: string }>();

    // blackjack game stats
    const bjGameQb = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.lobbies', 'lobby')
      .leftJoin('lobby.blackjackGames', 'game')
      .where('user.id = :userId', { userId });

    if (resetStatsAt) {
      bjGameQb.andWhere('game.createdAt >= :resetStatsAt', { resetStatsAt });
    }

    const bjGameStats = await bjGameQb
      .select([
        'COALESCE(SUM(game.wagered), 0) AS "totalWagered"',
        'COALESCE(SUM(game.profitAmount), 0) AS "totalProfit"',
      ])
      .getRawOne<{ totalWagered: string; totalProfit: string }>();

    const bjBetsQb = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.lobbies', 'lobby')
      .leftJoin('lobby.blackjackGames', 'game')
      .leftJoin('game.players', 'player')
      .where('user.id = :userId', { userId });

    if (resetStatsAt) {
      bjBetsQb.andWhere('player.createdAt >= :resetStatsAt', { resetStatsAt });
    }

    const bjBetsResult = await bjBetsQb
      .select('COUNT(DISTINCT player.id)', 'totalBets')
      .getRawOne<{ totalBets: string }>();

    // roulette game stats
    const rouletteGameQb = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.lobbies', 'lobby')
      .leftJoin('lobby.rouletteGames', 'rouletteGame')
      .where('user.id = :userId', { userId });

    if (resetStatsAt) {
      rouletteGameQb.andWhere('rouletteGame.createdAt >= :resetStatsAt', { resetStatsAt });
    }

    const rouletteGameStats = await rouletteGameQb
      .select([
        'COALESCE(SUM(rouletteGame.wagered), 0) AS "totalWagered"',
        'COALESCE(SUM(rouletteGame.profitAmount), 0) AS "totalProfit"',
      ])
      .getRawOne<{ totalWagered: string; totalProfit: string }>();

    const rouletteBetsQb = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.lobbies', 'lobby')
      .leftJoin('lobby.rouletteGames', 'rouletteGame')
      .leftJoin('rouletteGame.bets', 'rouletteBet')
      .where('user.id = :userId', { userId });

    if (resetStatsAt) {
      rouletteBetsQb.andWhere('rouletteBet.createdAt >= :resetStatsAt', { resetStatsAt });
    }

    const rouletteBetsResult = await rouletteBetsQb
      .select('COUNT(DISTINCT rouletteBet.id)', 'totalBets')
      .getRawOne<{ totalBets: string }>();

    // combine stats from both games
    const totalLobbies = parseInt(lobbiesResult?.totalLobbies ?? '0', 10);
    const bjWagered = parseFloat(bjGameStats?.totalWagered ?? '0');
    const bjProfit = parseFloat(bjGameStats?.totalProfit ?? '0');
    const bjBets = parseInt(bjBetsResult?.totalBets ?? '0', 10);
    const rouletteWagered = parseFloat(rouletteGameStats?.totalWagered ?? '0');
    const rouletteProfit = parseFloat(rouletteGameStats?.totalProfit ?? '0');
    const rouletteBets = parseInt(rouletteBetsResult?.totalBets ?? '0', 10);

    const totalWagered = bjWagered + rouletteWagered;
    const totalProfit = bjProfit + rouletteProfit;
    const totalBets = bjBets + rouletteBets;

    return new ProfileStatsDTO({
      username,
      createdAt,
      wagered: totalWagered,
      netProfit: totalProfit,
      totalBets,
      totalLobbies,
    });
  }

  public async resetUserStats(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new ServiceError('User not found');

    user.resetStatsAt = new Date();
    await this.userRepository.save(user);
  }

  public async createUser(payload: SignupDTO): Promise<User> {
    const passwordHash = await this.hashPassword(payload.password);

    const user = this.userRepository.create({
      email: payload.email,
      username: payload.username,
      avatarUrl: null,
      emailVerifiedAt: null,
      password: passwordHash,
      balance: 0,
    });

    return this.userRepository.save(user);
  }

  public async createGoogleUser(payload: GoogleSignupDTO): Promise<User> {
    const user = this.userRepository.create({
      email: payload.email,
      username: payload.username,
      avatarUrl: payload.avatar,
      emailVerifiedAt: payload.emailVerified ? new Date() : null,
      password: null,
      balance: 0,
      googleId: payload.googleId,
    });

    return this.userRepository.save(user);
  }

  public async createWallet(payload: UserWalletDTO): Promise<UserWallet> {
    const wallet = this.userWalletRepository.create({
      address: payload.address,
      asset: payload.asset,
      vaultId: payload.vaultId,
      user: { id: payload.userId },
    });

    return this.userWalletRepository.save(wallet);
  }

  public async getUserWallet(userId: string, asset: WalletAsset): Promise<UserWallet | null> {
    return this.userWalletRepository.findOne({ where: { user: { id: userId }, asset: asset } });
  }

  public async getUserVault(userId: string): Promise<UserWallet | null> {
    return this.userWalletRepository.findOne({ where: { user: { id: userId } } });
  }

  public async findUserIdByVaultId(vaultId: string): Promise<string | null> {
    const wallet = await this.userWalletRepository.findOne({ where: { vaultId } });
    return wallet?.userId ?? null;
  }

  public async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .orWhere('LOWER(user.username) = LOWER(:username)', { username })
      .getOne();
  }

  public async findByGoogleId(googleId: string) {
    return this.userRepository.findOne({ where: { googleId } });
  }

  public async updateGoogleId(userId: string, payload: TokenPayload) {
    await this.userRepository.update(
      { id: userId },
      { googleId: payload.sub, displayName: payload.name, emailVerifiedAt: payload.email_verified ? new Date() : null },
    );
    return this.findById(userId);
  }

  public async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new ServiceError('User not found');
    }

    return user;
  }

  public checkPassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }

  public hashPassword(plainPassword: string): Promise<string> {
    const saltRounds = Number(this.configService.getSaltRounds());
    return bcrypt.hash(plainPassword, saltRounds);
  }

  async updateBalance(
    userId: string,
    amount: number,
    manager?: EntityManager,
    context?: UserBalanceChangeContext,
  ): Promise<void> {
    const run = async (m: EntityManager) => {
      const user = await m.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new ServiceError('User not found');

      const oldBalance = user.balance;
      const newBalance = user.balance + amount;
      if (newBalance < 0) throw new ServiceError('Insufficient balance');

      user.balance = newBalance;
      await m.save(user);

      if (context?.logType) {
        await this.balanceLogService.createLog(
          {
            userId,
            type: context.logType,
            amount,
            balanceBefore: oldBalance,
            balanceAfter: newBalance,
            lobbyId: context.lobbyId,
            gameId: context.gameId,
            gameType: context.gameType,
            playerId: context.playerId,
            reason: context.reason,
            relatedTransactionId: context.relatedTransactionId,
          },
          m,
        );
      }

      this.logger.log(
        `User (${userId}) Balance ${newBalance > oldBalance ? 'INCREASED' : 'DECREASED'}, ${oldBalance} -> ${newBalance} ${context?.gameId ? `, Game: ${context.gameId}` : ''} ${context?.playerId ? `, Player: ${context.playerId}` : ''} ${context?.reason ? `, Reason: ${context.reason}` : ''}`,
      );

      this.dispatcher.emitUserBalanceUpdate(user.id, user.balance);
    };

    if (manager) return run(manager);
    return this.dataSource.transaction(run);
  }

  public async changePassword(userId: string, newPassword: string): Promise<boolean> {
    await this.userRepository.update(userId, { password: await this.hashPassword(newPassword) });
    return true;
  }

  public async changeUsername(username: string, userId: string): Promise<boolean> {
    await this.userRepository.update(userId, { username });
    return true;
  }

  public async markEmailAsVerified(userId: string): Promise<boolean> {
    await this.userRepository.update(userId, { emailVerifiedAt: new Date() });
    return true;
  }

  public generateIntercomHash(userId: string): string {
    const secret = this.configService.getIntercomSecretKey();
    if (!secret) {
      throw new ServiceError('Intercom secret key not configured');
    }
    return crypto.createHmac('sha256', secret).update(userId).digest('hex');
  }
}
