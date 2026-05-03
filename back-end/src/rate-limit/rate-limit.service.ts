import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RateLimitService {
  public static RATE_LIMIT_META_KEY = 'rate-limit';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async isAllowed(key: string, ttlSec: number): Promise<boolean> {
    const ttlMs = Math.ceil(ttlSec * 1000);
    const result = await this.redis.set(key, '1', 'PX', ttlMs, 'NX');
    return result === 'OK'; // only 'OK' if the key was set (i.e., first call)
  }
}
