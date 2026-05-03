import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum TransactionStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  DECLINED = 'declined',
  DECLINED_WITHOUT_REFUND = 'declined_without_refund',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ name: 'user_transactions' })
export class UserTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'float', default: 0 })
  public amount: number;

  @Column({ type: 'float', default: 0 })
  public amountUsd: number;

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

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  public userId: string | null;
}
