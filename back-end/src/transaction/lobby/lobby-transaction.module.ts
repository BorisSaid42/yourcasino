import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LobbyTransaction } from './lobby-transaction.entity';
import { LobbyTransactionService } from './lobby-transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([LobbyTransaction])],
  providers: [LobbyTransactionService],
  exports: [LobbyTransactionService],
})
export class LobbyTransactionModule {}
