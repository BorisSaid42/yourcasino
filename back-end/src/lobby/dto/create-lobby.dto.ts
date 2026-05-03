import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateLobbyDTO {
  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  public isBlackjackSelected: boolean;

  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  public isRouletteSelected: boolean;

  @ValidateIf((o: CreateLobbyDTO) => o.isBlackjackSelected)
  @Transform(({ value }) => (isNaN(Number(value)) ? undefined : Number(value)))
  @IsNumber()
  @IsPositive()
  @Min(25)
  @Max(1000000)
  public bankroll: number;

  @ValidateIf((o: CreateLobbyDTO) => o.isBlackjackSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(0.5)
  @Max(5000)
  public minBet: number;

  @ValidateIf((o: CreateLobbyDTO) => o.isBlackjackSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(0.5)
  @Max(5000)
  public maxBet: number;

  @ValidateIf((o: CreateLobbyDTO) => o.isRouletteSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(25)
  @Max(1000000)
  public rouletteBankroll: number;

  @ValidateIf((o: CreateLobbyDTO) => o.isRouletteSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(0.5)
  @Max(5000)
  public rouletteMinBet: number;

  @ValidateIf((o: CreateLobbyDTO) => o.isRouletteSelected)
  @Transform(({ value }: { value: unknown }) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @IsPositive()
  @Min(0.5)
  @Max(5000)
  public rouletteMaxBet: number;

  @IsString()
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Code can only contain letters and numbers' })
  public code: string;

  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  public isPrivate: boolean;

  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  public sideBets: boolean;

  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  public tos: boolean;
}
