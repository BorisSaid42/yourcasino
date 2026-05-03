import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlackjackPlayerModule } from '../blackjack-player/blackjack-player.module';
import { LobbyModule } from '../lobby/lobby.module';
import { SocketDispatcherModule } from '../socket/dispatcher/dispatcher.module';
import { UserModule } from '../user/user.module';
import { BlackjackBet } from './blackjack-bet.entity';
import { BlackjackGame } from './blackjack-game.entity';
import { BlackjackHand } from './blackjack-hand.entity';
import { BlackjackController } from './blackjack.controller';
import { BlackjackService } from './blackjack.service';
import { BlackjackScheduler } from './blackjack.scheduler';
import { RandomOrgModule } from '../random-org/random-org.module';
import { BlackjackManager } from './blackjack.manager';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlackjackBet, BlackjackGame, BlackjackHand]),
    ConfigModule,
    UserModule,
    LobbyModule,
    RedisModule,
    SocketDispatcherModule,
    BlackjackPlayerModule,
    RandomOrgModule,
    MaintenanceModule,
  ],
  controllers: [BlackjackController],
  providers: [BlackjackService, BlackjackScheduler, BlackjackManager],
  exports: [BlackjackService, BlackjackManager],
})
export class BlackjackModule {}
