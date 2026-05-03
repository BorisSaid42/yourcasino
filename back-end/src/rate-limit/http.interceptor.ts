import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class HttpRateLimitInterceptor implements NestInterceptor {
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

    const request = context.switchToHttp().getRequest<Request>();
    const credentials = request.credentials;
    const userId = credentials?.user || request.ip || 'anonymous'; //

    const key = `${meta.key}:${userId}`;
    const allowed = await this.rateLimitService.isAllowed(key, meta.ttl);
    if (!allowed) throw new HttpException(meta.message ?? 'Too many requests', HttpStatus.TOO_MANY_REQUESTS);

    return next.handle();
  }
}
