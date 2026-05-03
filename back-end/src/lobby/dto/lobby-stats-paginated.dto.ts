import { Expose } from 'class-transformer';

export class LobbyStatsDTO {
  @Expose()
  public id: string;

  @Expose()
  public status: string;

  @Expose()
  public name: string;

  @Expose()
  public code: string;

  @Expose()
  public inviteLink: string;

  @Expose()
  public minBet: number;

  @Expose()
  public maxBet: number;

  @Expose()
  public bankroll: number;

  @Expose()
  public rouletteMinBet: number;

  @Expose()
  public rouletteMaxBet: number;

  @Expose()
  public rouletteBankroll: number;

  @Expose()
  public netProfit: number;

  @Expose()
  public profitPercentage: number;

  constructor(data: LobbyStatsDTO) {
    this.id = data.id;
    this.status = data.status;
    this.name = data.name;
    this.code = data.code;
    this.inviteLink = data.inviteLink;
    this.minBet = data.minBet;
    this.maxBet = data.maxBet;
    this.bankroll = data.bankroll;
    this.rouletteMinBet = data.rouletteMinBet;
    this.rouletteMaxBet = data.rouletteMaxBet;
    this.rouletteBankroll = data.rouletteBankroll;
    this.netProfit = data.netProfit;
    this.profitPercentage = data.profitPercentage;
  }
}

export class LobbyStatsPaginatedDTO {
  @Expose()
  public data: LobbyStatsDTO[];

  @Expose()
  public page: number;

  @Expose()
  public totalPages: number;

  @Expose()
  public total: number;

  constructor(data: LobbyStatsPaginatedDTO) {
    this.data = data.data;
    this.page = data.page;
    this.totalPages = data.totalPages;
    this.total = data.total;
  }
}
