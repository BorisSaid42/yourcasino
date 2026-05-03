import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { SocketDispatcher } from './dispatcher';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [ConfigModule, RedisModule],
  providers: [SocketDispatcher],
  exports: [SocketDispatcher],
})
export class SocketDispatcherModule {}
