import { Module } from '@nestjs/common';
import { SocketDispatcherModule } from '../socket/dispatcher/dispatcher.module';
import { UserModule } from '../user/user.module';
import { FireblocksController } from './fireblocks.controller';
import { FireblocksService } from './fireblocks.service';
import { ConfigModule } from '../config/config.module';
import { UserTransactionModule } from '../transaction/user-transaction.module';
import { NotificationModule } from '../notification/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetRateCache } from './asset-rate-cache.entity';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetRateCache]),
    ConfigModule,
    SocketDispatcherModule,
    UserModule,
    UserTransactionModule,
    NotificationModule,
    RateLimitModule,
    TelegramModule,
  ],
  controllers: [FireblocksController],
  providers: [FireblocksService],
  exports: [FireblocksService],
})
export class FireblocksModule {}
