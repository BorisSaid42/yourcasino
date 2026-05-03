import { Expose } from 'class-transformer';
import { LobbyState } from '../lobby.entity';

export class LobbyListDTO {
  @Expose()
  public data: LobbyDataDTO[];

  @Expose()
  public total: number;

  @Expose()
  public totalPrivate: number;

  constructor(data: LobbyDataDTO[], total: number, totalPrivate: number) {
    this.data = data;
    this.total = total;
    this.totalPrivate = totalPrivate;
  }
}

export class LobbyDataDTO {
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
  public summedBankroll: number;

  @Expose()
  public owner: string;

  @Expose()
  public currentPlayerCount: number;

  @Expose()
  public roulettePlayerCount: number;

  @Expose()
  public status: LobbyState;

  constructor(lobby: LobbyDataDTO) {
    this.id = lobby.id;
    this.name = lobby.name;
    this.code = lobby.code;
    this.inviteLink = lobby.inviteLink;
    this.owner = lobby.owner;
    this.currentPlayerCount = lobby.currentPlayerCount;
    this.roulettePlayerCount = lobby.roulettePlayerCount;
    this.status = lobby.status;

    this.isBlackjackEnabled = lobby.isBlackjackEnabled;
    if (lobby.isBlackjackEnabled) {
      this.bankroll = lobby.bankroll;
      this.minBet = lobby.minBet;
      this.maxBet = lobby.maxBet;
    }

    this.isRouletteEnabled = lobby.isRouletteEnabled;
    if (lobby.isRouletteEnabled) {
      this.rouletteBankroll = lobby.rouletteBankroll;
      this.rouletteMinBet = lobby.rouletteMinBet;
      this.rouletteMaxBet = lobby.rouletteMaxBet;
    }

    if (lobby.isBlackjackEnabled && lobby.isRouletteEnabled) {
      this.summedBankroll = lobby.summedBankroll;
    }
  }
}
