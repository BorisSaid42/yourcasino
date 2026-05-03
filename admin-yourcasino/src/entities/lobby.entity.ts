import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum LobbyState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
}

@Entity({ name: 'lobbies' })
export class Lobby extends BaseEntity {
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

  @Column({ type: 'varchar', nullable: true })
  public ownerId: string;

  @Column({ type: 'timestamp' })
  public activatedAt: Date;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
