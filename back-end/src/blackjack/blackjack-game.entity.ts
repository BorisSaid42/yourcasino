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
import { BlackjackPlayer } from '../blackjack-player/blackjack-player.entity';

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

export type BlackjackTimerType = 'countdown' | 'player_turn' | 'insurance';

@Entity({ name: 'blackjack_games' })
export class BlackjackGame {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public isCurrent: boolean;

  @Column({ enum: BlackjackGameStatus, default: BlackjackGameStatus.WAITING_PLAYERS })
  public status: BlackjackGameStatus;

  @Column({ type: 'timestamptz', nullable: true })
  public timerDeadline: Date | null;

  @Column({ type: 'varchar', nullable: true })
  public timerType: BlackjackTimerType | null;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  public fullDeck: string[];

  @Column({ type: 'jsonb', default: () => `'[]'` })
  public deck: string[];

  @Column({ type: 'int', default: 1 })
  public numOfDecks: number;

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

  @Column({ nullable: true })
  public serverSeed: string;

  @Column({ nullable: true })
  public fairnessRandom: string;

  @Column({ default: false })
  public payedOut: boolean;

  @RelationId((game: BlackjackGame) => game.lobby)
  public lobbyId: string;

  @ManyToOne(() => Lobby, (lobby) => lobby.blackjackGames)
  public lobby: Lobby;

  @OneToMany(() => BlackjackPlayer, (player) => player.game)
  public players: BlackjackPlayer[];

  @CreateDateColumn({ type: 'timestamptz' })
  public createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  public updatedAt: Date;
}
