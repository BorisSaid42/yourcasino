import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class FairnessPayloadDTO {
  @IsString()
  @MinLength(64)
  @MaxLength(192)
  public serverSeed: string;

  @IsString()
  @MinLength(64)
  @MaxLength(192)
  public fairnessRandom: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  public numOfDecks: number;
}
