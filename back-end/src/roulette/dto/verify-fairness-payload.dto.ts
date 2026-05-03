import { IsString } from 'class-validator';

export class FairnessPayloadDTO {
  @IsString()
  public serverSeed: string;

  @IsString()
  public fairnessRandom: string;
}
