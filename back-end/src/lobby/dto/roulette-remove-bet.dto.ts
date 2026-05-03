import { IsEnum, IsUUID } from 'class-validator';
import { RouletteBetPlace } from '../../roulette/roulette-bet-place.enum';

export class RouletteRemoveBetDTO {
  @IsUUID()
  lobbyId: string;

  @IsEnum(RouletteBetPlace, { message: 'Invalid bet place' })
  betPlace: RouletteBetPlace;
}
