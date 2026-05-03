import { Expose } from 'class-transformer';
import { LobbyDTO } from '../../lobby/dto/lobby.dto';
import { RouletteGame, RouletteGameStatus, RouletteTimerType } from '../roulette-game.entity';
import { RouletteBetDTO } from './roulette-bet.dto';

export class RouletteGameDTO {
  @Expose()
  public id: string;

  @Expose()
  public isCurrent: boolean;

  @Expose()
  public status: RouletteGameStatus;

  @Expose()
  public result: number;

  @Expose()
  public lobby: LobbyDTO;

  @Expose()
  public lobbyId: string;

  @Expose()
  public timerDeadline: Date | null;

  @Expose()
  public timerType: RouletteTimerType | null;

  @Expose()
  public userId: string;

  @Expose()
  public bets: RouletteBetDTO[];

  constructor(data: RouletteGame) {
    this.id = data.id;
    this.lobby = new LobbyDTO(data.lobby);
    this.lobbyId = data.lobbyId;
    this.result = data.result;
    this.timerDeadline = data.timerDeadline;
    this.timerType = data.timerType;
    this.bets = data.bets.map((bet) => new RouletteBetDTO(bet));
    this.isCurrent = data.isCurrent;
    this.status = data.status;
  }
}
