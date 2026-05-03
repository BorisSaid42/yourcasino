import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Credentials } from '../dto/jwt-credentials.dto';

@Injectable()
export class JWTService {
  constructor(public readonly jwt: JwtService) {}

  public parseJwtToken(jwtToken?: string): Credentials | null {
    if (!jwtToken) {
      return null;
    }

    try {
      return this.jwt.verify<Credentials>(jwtToken.replace(/^Bearer\s/, ''));
    } catch {
      return null;
    }
  }
}
