import { Expose } from 'class-transformer';

export class ProfileStatsDTO {
  @Expose()
  public username: string;

  @Expose()
  public wagered: number;

  @Expose()
  public netProfit: number;

  @Expose()
  public totalBets: number;

  @Expose()
  public totalLobbies: number;

  @Expose()
  public createdAt: Date;

  constructor(data: ProfileStatsDTO) {
    this.username = data.username;
    this.wagered = data.wagered;
    this.netProfit = data.netProfit;
    this.totalBets = data.totalBets;
    this.totalLobbies = data.totalLobbies;
    this.createdAt = data.createdAt;
  }
}
