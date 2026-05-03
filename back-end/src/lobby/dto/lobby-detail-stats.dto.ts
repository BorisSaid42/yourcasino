import { Expose } from 'class-transformer';
import { BlackjackGameStatisticsDTO } from '../../blackjack/dto/blackjack-game-stats.dto';

export class LobbyDeatilStatisticsDTO {
  @Expose()
  public id: string;

  @Expose()
  public gameStats: BlackjackGameStatisticsDTO[];

  @Expose()
  public netProfit: number;

  @Expose()
  public wagered: number;

  @Expose()
  public totalBets: number;

  @Expose()
  public activatedAt: Date;

  constructor(data: LobbyDeatilStatisticsDTO) {
    this.id = data.id;
    this.gameStats = data.gameStats.map((game) => new BlackjackGameStatisticsDTO(game));
    this.netProfit = data.netProfit;
    this.wagered = data.wagered;
    this.totalBets = data.totalBets;
    this.activatedAt = data.activatedAt;
  }
}
