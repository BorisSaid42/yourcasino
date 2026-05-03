import { Expose } from 'class-transformer';
import { BlackjackGame, BlackjackGameStatus, BlackjackTimerType } from '../blackjack-game.entity';
import { LobbyDTO } from '../../lobby/dto/lobby.dto';
import { BlackjackPlayerDTO } from '../../blackjack-player/dto/blackjack-player.dto';

export class BlackjackGameDTO {
  @Expose()
  public isCurrent: boolean;

  @Expose()
  public insuranceTimerActive: boolean;

  @Expose()
  public status: BlackjackGameStatus;

  @Expose()
  public dealerHand: string[];

  @Expose()
  public dealerHandTotal: number;

  @Expose()
  public currentPlayerId: string;

  @Expose()
  public lobby: LobbyDTO;

  @Expose()
  public lobbyId: string;

  @Expose()
  public timerDeadline: Date | null;

  @Expose()
  public timerType: BlackjackTimerType | null;

  @Expose()
  public players: BlackjackPlayerDTO[];

  constructor(data: BlackjackGame, insuranceTimerActive?: boolean) {
    this.lobby = new LobbyDTO(data.lobby);
    this.lobbyId = data.lobbyId;
    this.players = data.players.map((player) => new BlackjackPlayerDTO(player));
    this.isCurrent = data.isCurrent;
    this.status = data.status;
    this.timerDeadline = data.timerDeadline;
    this.timerType = data.timerType;
    this.insuranceTimerActive = insuranceTimerActive || false;
    this.dealerHand = [
      BlackjackGameStatus.DEALER_PLAYING,
      BlackjackGameStatus.RESOLVING_USER_PAYOUTS,
      BlackjackGameStatus.RESOLVING_BETS,
      BlackjackGameStatus.FINISHED,
    ].includes(data.status)
      ? data.dealerHand
      : data.dealerHand.slice(0, 1);
    this.dealerHandTotal = data.dealerHandTotal;
    this.currentPlayerId = data.currentPlayerId;
  }
}
