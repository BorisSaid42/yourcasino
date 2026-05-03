import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Lobby } from '../lobby/lobby.entity';

export enum BalanceLogType {
  // Crypto transactions
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',

  WITHDRAW_FAILED_REFUND = 'withdraw_failed_refund',
  WITHDRAW_CANCELLED_REFUND = 'withdraw_cancelled_refund',
  WITHDRAW_DECLINED_REFUND = 'withdraw_declined_refund',
  WITHDRAW_DECLINED_WITHOUT_REFUND = 'withdraw_declined_without_refund',

  // Game transactions
  BET_PLACED = 'bet_placed',

  // Lobby transactions
  LOBBY_CREATED = 'lobby_created',
  LOBBY_DEPOSIT = 'lobby_deposit',
  LOBBY_WITHDRAW = 'lobby_withdraw',
  LOBBY_PROFIT_WITHDRAW = 'lobby_profit_withdraw',

  // Lobby game payouts
  GAME_PAYOUT = 'game_payout',

  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

@Entity({ name: 'user_balance_logs' })
export class UserBalanceLog {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne(() => User, { nullable: false })
  public user: User;

  @Column({ type: 'enum', enum: BalanceLogType })
  public type: BalanceLogType;

  @Column({ type: 'float' })
  public amount: number;

  @Column({ type: 'float' })
  public balanceBefore: number;

  @Column({ type: 'float' })
  public balanceAfter: number;

  // Optional context
  @ManyToOne(() => Lobby, { nullable: true })
  public lobby: Lobby | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  public gameId: string | null; // Blackjack/Roulette game ID

  @Column({ type: 'varchar', length: 24, nullable: true })
  public gameType: 'blackjack' | 'roulette' | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  public playerId: string | null; // Blackjack player ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  public reason: string | null; // Additional context

  @Column({ type: 'varchar', length: 36, nullable: true })
  public relatedTransactionId: string | null; // Link to UserTransaction for crypto ops

  @CreateDateColumn()
  public createdAt: Date;
}
