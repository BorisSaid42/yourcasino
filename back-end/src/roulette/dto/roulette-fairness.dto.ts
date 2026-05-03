import { Expose } from 'class-transformer';
import { getSha256 } from '../../common/utils';
import { RouletteGame, RouletteGameStatus } from '../roulette-game.entity';

export class RouletteFairnessDTO {
  @Expose()
  public id: string;

  @Expose()
  public serverSeed: string;

  @Expose()
  public serverSeedHash: string;

  @Expose()
  public fairnessRandom: string;

  @Expose()
  public result: number;

  @Expose()
  public updatedAt: Date;

  constructor(game: RouletteGame) {
    this.id = game.id;
    if (game.status === RouletteGameStatus.FINISHED) {
      this.serverSeed = game.serverSeed;
    }
    this.serverSeedHash = getSha256(game.serverSeed);
    this.result = game.result;
    this.fairnessRandom = game.fairnessRandom;
    this.updatedAt = game.updatedAt;
  }
}
