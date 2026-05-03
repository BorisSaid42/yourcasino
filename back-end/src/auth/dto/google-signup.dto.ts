import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

export class GoogleSignupDTO {
  @IsEmail()
  public email: string;

  @IsString()
  public username: string;

  @IsString()
  @IsOptional()
  public displayName?: string;

  @IsString()
  @IsOptional()
  public avatar?: string;

  @IsBoolean()
  public tos: boolean;

  @IsBoolean()
  public emailVerified: boolean;

  @IsString()
  @IsOptional()
  public googleId?: string;

  constructor(body?: Partial<GoogleSignupDTO>) {
    Object.assign(this, body);
  }
}
