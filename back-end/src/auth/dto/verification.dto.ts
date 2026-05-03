import { IsString, IsUUID } from 'class-validator';

export enum CodeVerificationType {
  REGISTER = 'register',
  RESET_PASSWORD = 'reset-password',
}
export class VerificationDTO {
  @IsUUID()
  userId!: string;

  @IsString()
  code!: string;

  constructor(verification?: Partial<VerificationDTO>) {
    Object.assign(this, verification);
  }
}
