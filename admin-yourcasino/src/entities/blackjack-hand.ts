import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'blackjack_hands' })
export class BlackjackHand extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', nullable: true })
  public playerId: string;

  @Column({ type: 'jsonb', default: [] })
  public hand: string[];

  @Column({ type: 'int', default: 0 })
  public handTotal: number;

  @Column({ default: false })
  public hasStood: boolean;

  @Column({ default: false })
  public isBusted: boolean;

  @Column({ default: false })
  public hasDoubled: boolean;

  @Column({ default: false })
  public isDoubledRevealed: boolean;

  @Column({ default: false })
  public hasSplitted: boolean;

  @Column({ type: 'int', default: 0 })
  public handIndex: number;

  @Column({ type: 'varchar', nullable: true })
  public payoutResult: string | null;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
