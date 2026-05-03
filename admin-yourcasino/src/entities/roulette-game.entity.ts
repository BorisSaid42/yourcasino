import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum RouletteGameStatus {
  WAITING_BETS = 'waiting_bets',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

@Entity({ name: 'roulette_games' })
export class RouletteGame extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public isCurrent: boolean;

  @Column({ enum: RouletteGameStatus, default: RouletteGameStatus.WAITING_BETS })
  public status: RouletteGameStatus;

  @Column({ nullable: true })
  public result: number;

  @Column({ type: 'float', default: 0 })
  public profitAmount: number;

  @Column({ type: 'float', default: 0 })
  public wagered: number;

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
