import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { UserTransactionController } from './user-transaction.controller';
import { UserTransaction } from './user-transaction.entity';
import { UserTransactionService } from './user-transaction.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserTransaction]), UserModule, NotificationModule],
  controllers: [UserTransactionController],
  providers: [UserTransactionService],
  exports: [UserTransactionService],
})
export class UserTransactionModule {}
