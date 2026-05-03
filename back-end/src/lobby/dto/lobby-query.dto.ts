import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export enum LobbySortField {
  CREATED_AT = 'createdAt',
  BANKROLL = 'bankroll',
  MIN_BET = 'minBet',
  MAX_BET = 'maxBet',
}

export enum LobbyFilterField {
  OPEN_SLOTS = 'openSlots',
  ALL_GAMES = 'allGames',
  BLACKJACK_ONLY = 'blackjackOnly',
  ROULETTE_ONLY = 'rouletteOnly',
}

export class LobbyQueryDTO {
  @IsOptional()
  @IsEnum(LobbySortField)
  sort?: LobbySortField;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(5)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[\w\s-]*$/u, { message: 'Search can only contain letters, numbers, spaces, and dashes' })
  @MaxLength(50)
  search?: string;

  @IsOptional()
  cursor?: string;

  @IsOptional()
  cursorId?: string;

  @IsOptional()
  @IsEnum(LobbyFilterField, { each: true })
  filter?: LobbyFilterField[];
}
