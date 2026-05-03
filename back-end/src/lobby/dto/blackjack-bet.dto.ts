import { IsEnum, IsNumber, IsPositive, IsUUID, Max, Min } from 'class-validator';
import { BlackjackBetPlace } from '../../blackjack/blackjack-bet.entity';

export class BlackjackBetDto {
  @IsUUID()
  lobbyId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.25)
  @Max(5000)
  amount: number;

  @IsEnum(BlackjackBetPlace, { message: 'Invalid bet place' })
  betPlace: BlackjackBetPlace;
}
