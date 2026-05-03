import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { ConfigModule } from '../config/config.module';
import { UserController } from './user.controller';
import { SocketDispatcherModule } from '../socket/dispatcher/dispatcher.module';
import { UserWallet } from './user-wallet.entity';
import { UserBalanceLog } from './user-balance-log.entity';
import { UserBalanceLogService } from './user-balance-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserWallet, UserBalanceLog]), SocketDispatcherModule, ConfigModule],
  providers: [UserService, UserBalanceLogService],
  exports: [UserService, UserBalanceLogService],
  controllers: [UserController],
})
export class UserModule {}
