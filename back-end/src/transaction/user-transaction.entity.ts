import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum TransactionStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  DECLINED = 'declined',
  DECLINED_WITHOUT_REFUND = 'declined_without_refund',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ name: 'user_transactions' })
export class UserTransaction {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'float', default: 0 })
  public amount: number;

  @Column({ type: 'float', default: 0 })
  public amountUsd: number;

  @Column({ type: 'float', default: 0 })
  public fee: number;

  @Column({ type: 'float', default: 0 })
  public networkFee: number;

  @Column()
  public type: 'deposit' | 'withdraw';

  @Column()
  public asset: string;

  @Column({ nullable: true })
  public transactionId: string;

  @Column({ nullable: true })
  public transactionHash: string;

  @Column({ type: 'enum', enum: TransactionStatus })
  public status: TransactionStatus;

  @Column({ nullable: true })
  public externalStatus: string;

  @Column({ nullable: true })
  public externalSubStatus: string;

  @Column({ nullable: true })
  public senderAddress: string;

  @Column({ nullable: true })
  public destinationAddress: string;

  @Column({ type: 'boolean', default: false })
  public refunded: boolean;

  @RelationId((transaction: UserTransaction) => transaction.user)
  public userId: string;

  @ManyToOne(() => User, (user) => user.transactions)
  public user: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
