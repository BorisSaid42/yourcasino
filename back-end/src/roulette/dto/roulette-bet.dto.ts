import { Expose } from 'class-transformer';
import { RouletteBet } from '../roulette-bet.entity';

export class RouletteBetDTO {
  @Expose()
  public id: string;

  @Expose()
  public betPlace: string;

  @Expose()
  public amount: number;

  @Expose()
  public wonAmount: number;

  @Expose()
  public userId: string;

  @Expose()
  public username: string;

  constructor(data: RouletteBet) {
    this.id = data.id;
    this.betPlace = data.betPlace;
    this.amount = data.amount;
    this.wonAmount = data.wonAmount;
    this.userId = data.userId;
    this.username = data.user.username;
  }
}
