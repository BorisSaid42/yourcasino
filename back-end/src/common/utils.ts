import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { type BigNumber } from 'bignumber.js';
import { DataSource, EntityManager, FindManyOptions, FindOneOptions, ObjectLiteral, Repository } from 'typeorm';

export function getRandomString(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export async function retry<TResult, TError = Error>(fn: () => Promise<TResult>, retries = 3) {
  let lastError = new Error('Failed to execute function') as TError;

  for (let retry = 0; retry < retries; retry++) {
    try {
      // we need 'await' in order for this try catch to work
      return await fn();
    } catch (e) {
      Logger.warn(`Retry attemt #${retry + 1} failed -> "${e}"`);
      lastError = e as TError;
    }
  }

  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw lastError;
}

export function getSha256(val: string): string {
  return createHash('sha256').update(val).digest('base64');
}

export async function withLockedEntity<T extends ObjectLiteral, R>(
  dataSource: DataSource,
  repo: Repository<T>,
  findOptions: FindOneOptions<T>,
  fn: (entity: T | null, manager: EntityManager) => Promise<R>,
) {
  return await dataSource.transaction(async (manager) => {
    const entity = await manager.getRepository(repo.target).findOne({
      ...findOptions,
      lock: { mode: 'pessimistic_write' },
    });

    await fn(entity, manager);
  });
}

export async function withLockedEntities<T extends ObjectLiteral, R>(
  dataSource: DataSource,
  repo: Repository<T>,
  findOptions: FindManyOptions<T>,
  fn: (entity: T[], manager: EntityManager) => Promise<R>,
) {
  return await dataSource.transaction(async (manager) => {
    const entities = await manager.getRepository(repo.target).find({
      ...findOptions,
      lock: { mode: 'pessimistic_write' },
    });

    return await fn(entities, manager);
  });
}

export function toBigInt(num: BigNumber): bigint {
  return BigInt(num.integerValue().toFixed(0));
}
