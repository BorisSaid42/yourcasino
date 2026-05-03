import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { BlackjackGame } from '../blackjack/blackjack-game.entity';
import { BlackjackBet } from '../blackjack/blackjack-bet.entity';
import { BlackjackHand } from '../blackjack/blackjack-hand.entity';

@Entity({ name: 'blackjack_players' })
export class BlackjackPlayer {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @RelationId((player: BlackjackPlayer) => player.game)
  public gameId: string;

  @ManyToOne(() => BlackjackGame, (game) => game.players)
  @JoinColumn()
  public game: BlackjackGame;

  @RelationId((player: BlackjackPlayer) => player.user)
  public userId: string;

  @ManyToOne(() => User)
  public user: User;

  @OneToMany(() => BlackjackBet, (bet) => bet.player)
  public bets: BlackjackBet[];

  @OneToMany(() => BlackjackHand, (hand) => hand.player, { cascade: true })
  public hands: BlackjackHand[];

  @Column({ type: 'int', default: 0 })
  public seatIndex: number;

  @Column()
  public currentHandId: string;

  @Column({ default: false })
  public insured: boolean;

  @Column({ default: false })
  public payedOut: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;
}
