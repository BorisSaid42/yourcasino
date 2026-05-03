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
import { BlackjackGame } from '../blackjack/blackjack-game.entity';
import { User } from '../user/user.entity';
import { RouletteGame } from '../roulette/roulette-game.entity';

export enum LobbyState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
}

@Entity({ name: 'lobbies' })
export class Lobby {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public code: string;

  @Column()
  public inviteLink: string;

  @Column()
  public name: string;

  @Column()
  public isBlackjackEnabled: boolean;

  @Column({ type: 'float', default: 0 })
  public bankroll: number;

  @Column({ type: 'float', default: 0 })
  public minBet: number;

  @Column({ type: 'float', default: 0 })
  public maxBet: number;

  @Column()
  public isRouletteEnabled: boolean;

  @Column({ type: 'float', default: 0 })
  public rouletteBankroll: number;

  @Column({ type: 'float', default: 0 })
  public rouletteMinBet: number;

  @Column({ type: 'float', default: 0 })
  public rouletteMaxBet: number;

  @Column({ enum: LobbyState })
  public status: LobbyState;

  @Column({ type: 'float', default: 0 })
  public blackjackWagered: number;

  @Column({ type: 'float', default: 0 })
  public blackjackProfitAmount: number;

  @Column({ type: 'float', default: 0 })
  public rouletteWagered: number;

  @Column({ type: 'float', default: 0 })
  public rouletteProfitAmount: number;

  @Column()
  public isPrivate: boolean;

  @Column()
  public sideBets: boolean;

  @Column({ type: 'int', default: 5 })
  public maxSeats: number;

  @RelationId((lobby: Lobby) => lobby.owner)
  public ownerId: string;

  @ManyToOne(() => User, (owner) => owner.lobbies)
  public owner: User;

  @OneToMany(() => BlackjackGame, (game) => game.lobby)
  public blackjackGames: BlackjackGame[];

  @OneToMany(() => RouletteGame, (game) => game.lobby)
  public rouletteGames: RouletteGame[];

  @Column({ type: 'timestamp' })
  public activatedAt: Date;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
