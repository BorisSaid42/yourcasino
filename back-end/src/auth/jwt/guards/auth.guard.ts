import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JWTService } from '../jwt.service';
import { UserService } from '../../../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JWTService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const isPublic = this.reflector.get<boolean | undefined>('isPublic', context.getHandler());

    if (!isPublic && !request.header('authorization')) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const jwtToken = request.header('authorization')?.replace(/^Bearer\s/, '');

    try {
      const credentials = this.jwtService.parseJwtToken(jwtToken);

      if (!isPublic && !credentials) {
        throw new UnauthorizedException('There is a problem with the user information. Missing user');
      }

      if (!isPublic && credentials && credentials.state === 'EMAIL_VERIFICATION_REQUIRED') {
        throw new UnauthorizedException('Please verify your email before accessing this resource.');
      }

      request.credentials = credentials ?? undefined;

      if (credentials && credentials.state === 'LOGGED_IN') {
        const user = await this.userService.findById(credentials.user);
        if (!user || (user.bannedUntil && user.bannedUntil > new Date())) {
          throw new ForbiddenException('This account is banned');
        }
      }

      return true;
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      return isPublic ?? false;
    }
  }
}
