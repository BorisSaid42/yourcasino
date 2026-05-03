import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Lobby } from '../lobby/lobby.entity';
import { RouletteBet } from './roulette-bet.entity';

export enum RouletteGameStatus {
  WAITING_BETS = 'waiting_bets',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export type RouletteTimerType = 'countdown';

@Entity({ name: 'roulette_games' })
export class RouletteGame {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public isCurrent: boolean;

  @Column({ nullable: true })
  public serverSeed: string;

  @Column({ nullable: true })
  public fairnessRandom: string;

  @Column({ enum: RouletteGameStatus, default: RouletteGameStatus.WAITING_BETS })
  public status: RouletteGameStatus;

  @Column({ nullable: true })
  public result: number;

  @Column({ type: 'float', default: 0 })
  public profitAmount: number;

  @Column({ type: 'float', default: 0 })
  public wagered: number;

  @RelationId((game: RouletteGame) => game.lobby)
  public lobbyId: string;

  @ManyToOne(() => Lobby, (lobby) => lobby.rouletteGames)
  public lobby: Lobby;

  @OneToMany(() => RouletteBet, (bet) => bet.game)
  public bets: RouletteBet[];

  @Column({ type: 'timestamptz', nullable: true })
  public timerDeadline: Date | null;

  @Column({ type: 'varchar', nullable: true })
  public timerType: RouletteTimerType | null;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
