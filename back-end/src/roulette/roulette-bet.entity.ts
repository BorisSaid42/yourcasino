import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { RouletteBetPlace } from './roulette-bet-place.enum';
import { RouletteGame } from './roulette-game.entity';

@Entity({ name: 'roulette_bets' })
export class RouletteBet {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ enum: RouletteBetPlace })
  public betPlace: RouletteBetPlace;

  @Column({ type: 'float' })
  public amount: number;

  @Column({ type: 'float', default: 0 })
  public wonAmount: number;

  @Column({ type: 'float', default: 0 })
  public profitAmount: number;

  @RelationId((bet: RouletteBet) => bet.game)
  public gameId: string;

  @ManyToOne(() => RouletteGame, (game) => game.bets, { onDelete: 'CASCADE' })
  public game: RouletteGame;

  @RelationId((bet: RouletteBet) => bet.user)
  public userId: string;

  @ManyToOne(() => User, (user) => user.bets, { onDelete: 'CASCADE' })
  public user: User;

  @Column()
  public version: number;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
