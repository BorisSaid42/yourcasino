import { Expose } from 'class-transformer';
import { RouletteBetPlace } from '../roulette-bet-place.enum';

/**
 * Aggregated bet DTO - combines multiple bets from the same user on the same bet place
 * This reduces payload size and makes it easier to display in the UI
 */
export class RouletteAggregatedBetDTO {
  @Expose()
  public userId: string;

  @Expose()
  public username: string;

  @Expose()
  public betPlace: RouletteBetPlace;

  @Expose()
  public amount: number;

  @Expose()
  public betCount: number;

  constructor(userId: string, username: string, betPlace: RouletteBetPlace, amount: number, betCount: number) {
    this.userId = userId;
    this.username = username;
    this.betPlace = betPlace;
    this.amount = amount;
    this.betCount = betCount;
  }
}
