import { IsEnum } from 'class-validator';

export enum GameType {
  BLACKJACK = 'blackjack',
  ROULETTE = 'roulette',
}

export class LobbyGameDTO {
  @IsEnum(GameType, { message: 'Game must be either blackjack or roulette' })
  public game: GameType;
}
