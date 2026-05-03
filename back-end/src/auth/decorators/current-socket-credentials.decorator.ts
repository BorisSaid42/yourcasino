import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Credentials, LoggedInCredentials } from '../dto/jwt-credentials.dto';

export const CurrentSocketCredentials = createParamDecorator(
  <TCredentials extends Credentials = LoggedInCredentials>(_: void, ctx: ExecutionContext): TCredentials | null => {
    const socket = ctx.switchToWs().getClient<Socket>();

    return (socket.handshake.auth.credentials as TCredentials) ?? null;
  },
);
