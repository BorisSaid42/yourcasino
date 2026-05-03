import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Credentials, LoggedInCredentials } from '../dto/jwt-credentials.dto';

export const CurrentCredentials = createParamDecorator(
  <TCredentials extends Credentials = LoggedInCredentials>(_: void, ctx: ExecutionContext): TCredentials | null => {
    const req = ctx.switchToHttp().getRequest<Request>();

    return (req.credentials as TCredentials) ?? null;
  },
);
