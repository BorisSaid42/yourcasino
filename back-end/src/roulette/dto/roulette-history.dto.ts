import { Expose } from 'class-transformer';
import { RouletteGame } from '../roulette-game.entity';

export class RouletteHistoryDTO {
  @Expose()
  public id: string;

  @Expose()
  public result: number;

  constructor(data: RouletteGame) {
    this.id = data.id;
    this.result = data.result;
  }
}
