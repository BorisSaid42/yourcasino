import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlackjackPlayerController } from './blackjack-player.controller';
import { BlackjackPlayer } from './blackjack-player.entity';
import { BlackjackPlayerService } from './blackjack-player.service';
import { BlackjackHand } from '../blackjack/blackjack-hand.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlackjackPlayer, BlackjackHand])],
  controllers: [BlackjackPlayerController],
  providers: [BlackjackPlayerService],
  exports: [BlackjackPlayerService],
})
export class BlackjackPlayerModule {}
