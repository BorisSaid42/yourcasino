import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined, IsEnum, IsNumber, IsOptional, IsPositive, Max, Min, ValidateIf } from 'class-validator';
import { LobbyState } from '../lobby.entity';

export class EditLobbyDTO {
  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  public isBlackjackSelected: boolean;

  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  public isRouletteSelected: boolean;

  @ValidateIf((o: EditLobbyDTO) => o.isBlackjackSelected)
  @Transform(({ value }) => (isNaN(Number(value)) ? undefined : Number(value)))
  @IsNumber()
  @IsPositive()
  @Min(25)
  @Max(1000000)
  public bankroll: number;

  @ValidateIf((o: EditLobbyDTO) => o.isBlackjackSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(0.5)
  @Max(5000)
  public minBet: number;

  @ValidateIf((o: EditLobbyDTO) => o.isBlackjackSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(0.5)
  @Max(5000)
  public maxBet: number;

  @ValidateIf((o: EditLobbyDTO) => o.isRouletteSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(25)
  @Max(1000000)
  public rouletteBankroll: number;

  @ValidateIf((o: EditLobbyDTO) => o.isRouletteSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(0.5)
  @Max(5000)
  public rouletteMinBet: number;

  @ValidateIf((o: EditLobbyDTO) => o.isRouletteSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(0.5)
  @Max(5000)
  public rouletteMaxBet: number;

  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  public isPrivate: boolean;

  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  public sideBets: boolean;

  @IsOptional()
  @IsEnum(LobbyState, {
    message: `status must be one of: ${Object.values(LobbyState).join(', ')}`,
  })
  @Transform(
    ({ value }): LobbyState | undefined => {
      if (value === undefined || value === null) {
        return LobbyState.ACTIVE;
      }
      return value as LobbyState;
    },
    { toClassOnly: true },
  )
  public status?: LobbyState;
}
