import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { Credentials } from '../auth/dto/jwt-credentials.dto';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class WsRateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const meta = this.reflector.get<{ key: string; ttl: number; message?: string }>(
      RateLimitService.RATE_LIMIT_META_KEY,
      context.getHandler(),
    );
    if (!meta) return next.handle();

    const socket = context.switchToWs().getClient<Socket>();

    const credentials = (socket.handshake.auth.credentials as Credentials) ?? null;
    const userId = credentials?.user || socket.id;

    const key = `${meta.key}:${userId}`;
    const allowed = await this.rateLimitService.isAllowed(key, meta.ttl);
    if (!allowed) throw new WsException(meta.message ?? 'Too many requests');

    return next.handle();
  }
}
