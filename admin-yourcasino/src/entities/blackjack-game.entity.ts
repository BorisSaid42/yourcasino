import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum BlackjackGameStatus {
  WAITING_PLAYERS = 'waiting_players',
  WAITING_BETS = 'waiting_bets',
  COUNTDOWN = 'countdown',
  DEALING = 'dealing',
  PLAYING = 'playing',
  DEALER_PLAYING = 'dealer_playing',
  RESOLVING_BETS = 'resolving_bets',
  RESOLVING_USER_PAYOUTS = 'resolving_user_payouts',
  FINISHED = 'finished',
}

@Entity({ name: 'blackjack_games' })
export class BlackjackGame extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public isCurrent: boolean;

  @Column({ enum: BlackjackGameStatus, default: BlackjackGameStatus.WAITING_PLAYERS })
  public status: BlackjackGameStatus;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  public deck: string[];

  @Column({ type: 'jsonb', default: () => `'[]'` })
  public fullDeck: string[];

  @Column({ type: 'jsonb', nullable: true })
  public dealerHand: string[];

  @Column({ type: 'int', default: 0 })
  public dealerHandTotal: number;

  @Column({ type: 'float', default: 0 })
  public profitAmount: number;

  @Column({ type: 'float', default: 0 })
  public wagered: number;

  @Column()
  public currentPlayerId: string;

  @Column({ type: 'varchar', nullable: true })
  public lobbyId: string;

  @Column({ nullable: true })
  public serverSeed: string;

  @Column({ nullable: true })
  public fairnessRandom: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
