import { IsString } from 'class-validator';

export class LoginDTO {
  @IsString()
  public usernameOrEmail: string;

  @IsString()
  public password: string;

  constructor(body?: Partial<LoginDTO>) {
    Object.assign(this, body);
  }
}
