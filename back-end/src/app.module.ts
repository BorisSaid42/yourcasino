import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RedisModule } from './redis/redis.module';
import { SocketGatewayModule } from './socket/gateway/gateway.module';
import { LobbyModule } from './lobby/lobby.module';
import { BlackjackModule } from './blackjack/blackjack.module';
import { FireblocksModule } from './fireblocks/fireblocks.module';
import { WebhooksModule } from './webhooks/webhook.module';
import { BlackjackPlayerModule } from './blackjack-player/blackjack-player.module';
import { RouletteModule } from './roulette/roulette.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    DbModule,
    RedisModule,
    ScheduleModule.forRoot(),
    RateLimitModule,
    AuthModule,
    SocketGatewayModule,
    LobbyModule,
    BlackjackModule,
    BlackjackPlayerModule,
    RouletteModule,
    FireblocksModule,
    WebhooksModule,
    MaintenanceModule,
    TelegramModule,
  ],
})
export class AppModule {}
