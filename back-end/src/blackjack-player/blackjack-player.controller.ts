import { Controller, Get, Query } from '@nestjs/common';
import { CurrentCredentials } from '../auth/decorators/current-credentials.decorator';
import { Credentials } from '../auth/dto/jwt-credentials.dto';
import { BlackjackPlayerService } from './blackjack-player.service';

@Controller({
  path: '/blackjack/player',
  version: '1',
})
export class BlackjackPlayerController {
  constructor(private readonly blackjackPlayerService: BlackjackPlayerService) {}

  @Get('/bets/history')
  async getPlayerBetHistory(
    @CurrentCredentials() credentials: Credentials,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.blackjackPlayerService.getPlayerBetHistory(credentials.user, page, limit);
  }
}
