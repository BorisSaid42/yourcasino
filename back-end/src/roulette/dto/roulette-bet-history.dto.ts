import { Expose } from 'class-transformer';

export class RouletteBetHistoryDTO {
  @Expose()
  public gameId: string;

  @Expose()
  public status: string;

  @Expose()
  public inviteLink: string;

  @Expose()
  public lobbyCode: string;

  @Expose()
  public totalBet: number;

  @Expose()
  public totalWon: number;

  @Expose()
  public createdAt: Date;

  constructor(data: RouletteBetHistoryDTO) {
    this.gameId = data.gameId;
    this.status = data.status;
    this.inviteLink = data.inviteLink;
    this.lobbyCode = data.lobbyCode;
    this.totalBet = data.totalBet;
    this.totalWon = data.totalWon;
    this.createdAt = data.createdAt;
  }
}
