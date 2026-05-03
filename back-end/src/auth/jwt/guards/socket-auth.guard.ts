import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JWTService } from '../jwt.service';
import { UserService } from '../../../user/user.service';

interface AuthPayload {
  token?: string;
  credentials?: unknown;
}

type AuthedSocket = Socket & {
  handshake: Socket['handshake'] & {
    auth: AuthPayload;
  };
};

@Injectable()
export class SocketAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JWTService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient<AuthedSocket>();
    const rawToken = socket.handshake.auth.token ?? null;

    if (!rawToken) {
      throw new WsException('Unauthenticated');
    }

    const jwtToken = rawToken.replace(/^Bearer\s/, '');

    if (!jwtToken || jwtToken === 'null' || jwtToken === 'undefined') {
      throw new WsException('Unauthenticated');
    }

    try {
      const credentials = this.jwtService.parseJwtToken(jwtToken);

      if (credentials && credentials.state === 'EMAIL_VERIFICATION_REQUIRED') {
        throw new WsException('Please verify your email before accessing this resource.');
      }

      socket.handshake.auth.credentials = credentials;

      if (credentials && credentials.state === 'LOGGED_IN') {
        const user = await this.userService.findById(credentials.user);
        if (!user || (user.bannedUntil && user.bannedUntil > new Date())) {
          throw new WsException('This account is banned');
        }
      }

      return true;
    } catch (e) {
      if (e instanceof WsException) {
        throw e;
      }
      throw new WsException('Invalid auth token');
    }
  }
}
