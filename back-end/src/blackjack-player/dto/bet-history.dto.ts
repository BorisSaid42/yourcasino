import { Expose } from 'class-transformer';
import { LobbyState } from '../../lobby/lobby.entity';

export class BetHistoryDTO {
  @Expose()
  public gameId: string;

  @Expose()
  public status: LobbyState;

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

  constructor(data: BetHistoryDTO) {
    this.gameId = data.gameId;
    this.status = data.status;
    this.inviteLink = data.inviteLink;
    this.lobbyCode = data.lobbyCode;
    this.totalBet = data.totalBet;
    this.totalWon = data.totalWon;
    this.createdAt = data.createdAt;
  }
}
