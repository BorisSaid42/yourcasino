import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWTModule } from '../auth/jwt/jwt.module';
import { ConfigModule } from '../config/config.module';
import { SocketDispatcherModule } from '../socket/dispatcher/dispatcher.module';
import { NotificationController } from './notification.controller';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), ConfigModule, JWTModule, SocketDispatcherModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
