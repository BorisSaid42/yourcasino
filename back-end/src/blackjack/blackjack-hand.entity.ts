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
import { BlackjackPlayer } from '../blackjack-player/blackjack-player.entity';
import { BlackjackBet } from './blackjack-bet.entity';
import { User } from '../user/user.entity';

@Entity({ name: 'blackjack_hands' })
export class BlackjackHand {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @RelationId((hand: BlackjackHand) => hand.player)
  public playerId: string;

  @ManyToOne(() => BlackjackPlayer, (player) => player.hands)
  public player: BlackjackPlayer;

  @RelationId((hand: BlackjackHand) => hand.user)
  public userId: string;

  @ManyToOne(() => User)
  public user: User;

  @OneToMany(() => BlackjackBet, (bet) => bet.hand)
  public bets: BlackjackBet[];

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
