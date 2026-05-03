import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined, IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_REGEX, PASSWORD_VALIDATION_MESSAGE } from '../constants/password-validation';

export class SignupDTO {
  @IsEmail()
  public email: string;

  @IsString()
  @MinLength(3, { message: 'Username is too short. Use at least 3 characters.' })
  @MaxLength(15, { message: 'Username is too long. Keep it under 16 characters.' })
  @Matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|[-_]{1,2})*$/, {
    message: 'Username must start with a letter or number and only use up to two symbols at a time.',
  })
  public username: string;

  @IsString()
  @MinLength(8, { message: 'Password is too short. Use at least 8 characters' })
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_VALIDATION_MESSAGE,
  })
  public password: string;

  @IsDefined()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  public tos: boolean;

  constructor(body?: Partial<SignupDTO>) {
    Object.assign(this, body);
  }
}
