import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { BlackjackPlayer } from '../blackjack-player/blackjack-player.entity';
import { BlackjackHand } from './blackjack-hand.entity';
import { User } from '../user/user.entity';

export enum BlackjackBetPlace {
  MAIN = 'main',
  SIDE21_3 = 'side_21_3',
  PERFECT_PAIR = 'perfect_pair',
}

@Entity({ name: 'blackjack_bets' })
export class BlackjackBet {
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

  @RelationId((bet: BlackjackBet) => bet.player)
  public playerId: string;

  @ManyToOne(() => BlackjackPlayer, (player) => player.bets, { nullable: true, onDelete: 'CASCADE' })
  public player: BlackjackPlayer;

  @RelationId((bet: BlackjackBet) => bet.user)
  public userId: string;

  @ManyToOne(() => User)
  public user: User;

  @RelationId((bet: BlackjackBet) => bet.hand)
  public handId: string;

  @ManyToOne(() => BlackjackHand, (hand) => hand.bets)
  public hand: BlackjackHand;

  @Column({ default: false })
  public insurance: boolean;

  @Column()
  public version: number;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
