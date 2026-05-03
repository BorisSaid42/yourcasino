import { Expose } from 'class-transformer';

export type BaseCredentials = { user: string; balance: number };

export type LoggedInCredentials = BaseCredentials & {
  state: 'LOGGED_IN';
};

export type EmailVerificationRequiredCredentials = BaseCredentials & { state: 'EMAIL_VERIFICATION_REQUIRED' };

export type Credentials = EmailVerificationRequiredCredentials | LoggedInCredentials;
export class JWTCredentialsDTO {
  @Expose()
  public user: string;

  @Expose()
  public balance?: number;

  @Expose()
  public state: Credentials['state'];

  @Expose()
  public jwt?: string;

  constructor(body?: Credentials & { jwt?: string }) {
    Object.assign(this, body);
  }
}
