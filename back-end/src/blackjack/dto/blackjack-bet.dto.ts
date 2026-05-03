import { Expose } from 'class-transformer';
import { BlackjackBet } from '../blackjack-bet.entity';

export class BlackjackBetDTO {
  @Expose()
  public betPlace: string;

  @Expose()
  public amount: number;

  @Expose()
  public wonAmount: number;

  constructor(data: BlackjackBet) {
    this.betPlace = data.betPlace;
    this.amount = data.amount;
    this.wonAmount = data.wonAmount;
  }
}
