import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum BlackjackBetPlace {
  MAIN = 'main',
  SIDE21_3 = 'side_21_3',
  PERFECT_PAIR = 'perfect_pair',
}

@Entity({ name: 'blackjack_bets' })
export class BlackjackBet extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ enum: BlackjackBetPlace })
  public betPlace: BlackjackBetPlace;

  @Column({ type: 'float' })
  public amount: number;

  @Column({ type: 'float', default: 0 })
  public wonAmount: number;

  @Column({ type: 'float', default: 0 })
  public profitAmount: number;

  @Column({ type: 'varchar', nullable: true })
  public playerId: string;

  @Column({ type: 'varchar', nullable: true })
  public handId: string;

  @Column({ default: false })
  public insurance: boolean;

  @Column()
  public version: number;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
