import { Expose } from 'class-transformer';
import { getSha256 } from '../../common/utils';

export class FairnessResponseDTO {
  @Expose()
  public serverSeed: string;

  @Expose()
  public serverSeedHash?: string;

  @Expose()
  public fairnessRandom: string;

  @Expose()
  public game?: string;

  @Expose()
  public result: number;

  constructor(data: FairnessResponseDTO) {
    this.serverSeed = data.serverSeed;
    this.serverSeedHash = getSha256(data.serverSeed);
    this.result = data.result;
    this.fairnessRandom = data.fairnessRandom;
    this.game = 'roulette';
  }
}
