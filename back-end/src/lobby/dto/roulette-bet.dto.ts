import { IsEnum, IsNumber, IsPositive, IsUUID, Max, Min } from 'class-validator';
import { RouletteBetPlace } from '../../roulette/roulette-bet-place.enum';

export class RouletteBetDTO {
  @IsUUID()
  lobbyId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.25)
  @Max(1000)
  amount: number;

  @IsEnum(RouletteBetPlace, { message: 'Invalid bet place' })
  betPlace: RouletteBetPlace;
}
