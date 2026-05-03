import { SetMetadata } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

export function RateLimit(key: string, ttl: number, message?: string) {
  return SetMetadata(RateLimitService.RATE_LIMIT_META_KEY, { key, ttl, message });
}
