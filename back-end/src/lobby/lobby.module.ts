import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { NotificationModule } from '../notification/notification.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { SocketDispatcherModule } from '../socket/dispatcher/dispatcher.module';
import { UserModule } from '../user/user.module';
import { LobbyController } from './lobby.controller';
import { Lobby } from './lobby.entity';
import { LobbyService } from './lobby.service';
import { LobbyCron } from './lobby.cron';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';
import { LobbyTransactionModule } from '../transaction/lobby/lobby-transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lobby]),
    SocketDispatcherModule,
    UserModule,
    NotificationModule,
    ConfigModule,
    RateLimitModule,
    MaintenanceModule,
    LobbyTransactionModule,
  ],
  controllers: [LobbyController],
  providers: [LobbyService, LobbyCron],
  exports: [LobbyService],
})
export class LobbyModule {}
