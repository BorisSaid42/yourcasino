import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsPositive, Max, Min } from 'class-validator';
import { GameType } from './lobby-game.dto';

export enum AddBankrollActionEnum {
  ADD = 'add',
  WITHDRAW = 'withdraw',
}

export class AddBankrollDTO {
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(0.1)
  @Max(1000000)
  public bankroll: number;

  @IsEnum(GameType, { message: 'Game must be either blackjack or roulette' })
  public game: GameType;

  @IsEnum(AddBankrollActionEnum, { message: 'Action must be either add or withdraw' })
  public action: AddBankrollActionEnum;
}
