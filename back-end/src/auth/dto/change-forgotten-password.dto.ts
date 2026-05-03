import { IsString, Matches, MinLength } from 'class-validator';
import { PASSWORD_REGEX, PASSWORD_VALIDATION_MESSAGE } from '../constants/password-validation';

export class ChangeForgottenPasswordDTO {
  @IsString()
  userId!: string;

  @IsString()
  @MinLength(8, { message: 'Password is too short. Use at least 8 characters' })
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_VALIDATION_MESSAGE,
  })
  password!: string;

  @IsString()
  code!: string;

  constructor(forgotenPassword: Partial<ChangeForgottenPasswordDTO>) {
    Object.assign(this, forgotenPassword);
  }
}
