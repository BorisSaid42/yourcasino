import { Expose } from 'class-transformer';

export class VerificationInfoDTO {
  @Expose()
  userId!: string;

  @Expose()
  code!: string;

  constructor(verificationInfo?: VerificationInfoDTO) {
    Object.assign(this, verificationInfo);
  }
}

// Safe DTO for API responses - never expose the verification code
export class PasswordResetResponseDTO {
  @Expose()
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
