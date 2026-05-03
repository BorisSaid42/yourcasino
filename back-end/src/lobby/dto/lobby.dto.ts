import { Expose } from 'class-transformer';
import { Lobby } from '../lobby.entity';

export class LobbyDTO {
  @Expose()
  public id: string;

  @Expose()
  public name: string;

  @Expose()
  public code: string;

  @Expose()
  public inviteLink: string;

  @Expose()
  public isBlackjackEnabled: boolean;

  @Expose()
  public bankroll: number;

  @Expose()
  public minBet: number;

  @Expose()
  public maxBet: number;

  @Expose()
  public isRouletteEnabled: boolean;

  @Expose()
  public rouletteBankroll: number;

  @Expose()
  public rouletteMinBet: number;

  @Expose()
  public rouletteMaxBet: number;

  @Expose()
  public rouletteProfitAmount: number;

  @Expose()
  public blackjackProfitAmount: number;

  @Expose()
  public ownerId: string;

  @Expose()
  public owner: string;

  @Expose()
  public link: string;

  @Expose()
  public status: string;

  @Expose()
  public isPrivate: boolean;

  @Expose()
  public sideBets: boolean;

  @Expose()
  public createdAt: Date;

  @Expose()
  public updatedAt: Date;

  @Expose()
  public currentPlayerCount: number;

  @Expose()
  public isLobbyPaused: boolean;

  @Expose()
  public isBlackjackPaused: boolean;

  @Expose()
  public isRoulettePaused: boolean;

  constructor(lobby: Lobby) {
    this.id = lobby.id;
    this.name = lobby.name;
    this.code = lobby.code;
    this.inviteLink = lobby.inviteLink;
    this.ownerId = lobby.owner.id;
    this.owner = lobby.owner.username;
    this.status = lobby.status;

    this.bankroll = lobby.bankroll;
    this.minBet = lobby.minBet;
    this.maxBet = lobby.maxBet;
    this.isBlackjackEnabled = lobby.isBlackjackEnabled;
    if (lobby.isBlackjackEnabled) {
      this.blackjackProfitAmount = lobby.blackjackProfitAmount;
    }

    this.rouletteBankroll = lobby.rouletteBankroll;
    this.rouletteMinBet = lobby.rouletteMinBet;
    this.rouletteMaxBet = lobby.rouletteMaxBet;
    this.isRouletteEnabled = lobby.isRouletteEnabled;
    if (lobby.isRouletteEnabled) {
      this.rouletteProfitAmount = lobby.rouletteProfitAmount;
    }

    this.isPrivate = lobby.isPrivate;
    this.sideBets = lobby.sideBets;
    this.createdAt = lobby.createdAt;
    this.updatedAt = lobby.updatedAt;
  }
}
