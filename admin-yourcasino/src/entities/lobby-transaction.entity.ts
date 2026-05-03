import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { Lobby } from './lobby.entity.js';

export enum TransactionType {
  CREATED_LOBBY = 'created_lobby',
  ADD_BALANCE = 'add_balance',
  WITHDRAW_BALANCE = 'withdraw_balance',
  WITHDRAW_HOUSE_PROFIT = 'withdraw_house_profit',
  GAME_BET_RESULT = 'game_bet_result',
}

export enum GameType {
  BLACKJACK = 'blackjack',
  ROULETTE = 'roulette',
}

@Entity({ name: 'lobby_transactions' })
export class LobbyTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ enum: TransactionType })
  public type: TransactionType;

  @Column({ enum: GameType })
  public game: GameType;

  @Column({ type: 'float', default: 0 })
  public amount: number;

  @RelationId((lt: LobbyTransaction) => lt.lobby)
  public lobbyId: string;

  @ManyToOne(() => Lobby)
  public lobby: Lobby;

  @CreateDateColumn()
  public createdAt: Date;
}
