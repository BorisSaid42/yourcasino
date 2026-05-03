import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { BlackjackService } from './blackjack.service';
import { BlackjackGameDTO } from './dto/blackjack-game.dto';
import { LobbyDeatilStatisticsDTO } from '../lobby/dto/lobby-detail-stats.dto';
import { Credentials } from '../auth/dto/jwt-credentials.dto';
import { CurrentCredentials } from '../auth/decorators/current-credentials.decorator';
import { BlackjackFairnessDTO } from './dto/blackjack-fairness.dto';
import { FairnessPayloadDTO } from './dto/verify-fairness-payload.dto';
import { FairnessResponseDTO } from './dto/verify-fairness-response.dto';
import { BlackjackManager } from './blackjack.manager';

@Controller({
  path: '/blackjack',
  version: '1',
})
export class BlackjackController {
  constructor(
    private readonly blackjackService: BlackjackService,
    private readonly blackjackManager: BlackjackManager,
  ) {}

  @IsPublic()
  @Get('/:lobbyId/current')
  public async getCurrentGame(@Param('lobbyId') lobbyId: string): Promise<BlackjackGameDTO | null> {
    const currentBjGame = await this.blackjackService.createOrGetActiveGame(lobbyId);

    if (!currentBjGame) return null;

    const insuranceTimerActive = this.blackjackManager.isInsuranceTimerActive(currentBjGame.lobbyId);

    return new BlackjackGameDTO(currentBjGame, insuranceTimerActive);
  }

  @IsPublic()
  @Get('/:lobbyId/fairness/history')
  public async getFairnessData(@Param('lobbyId') lobbyId: string): Promise<BlackjackFairnessDTO[]> {
    const gameFairnessHistory = await this.blackjackService.findFairnessGameByLobbyId(lobbyId);

    return gameFairnessHistory.map((data) => new BlackjackFairnessDTO(data));
  }

  @IsPublic()
  @Post('/fairness/verify')
  public verifyFairness(@Body() payload: FairnessPayloadDTO): FairnessResponseDTO {
    const result = this.blackjackService.generateShuffledDeck(
      payload.serverSeed,
      payload.fairnessRandom,
      payload.numOfDecks,
    );

    return new FairnessResponseDTO({
      serverSeed: payload.serverSeed,
      fairnessRandom: payload.fairnessRandom,
      result: result,
    });
  }

  @Get('/stats/:lobbyId')
  public async getLobbyDetailsStatistics(
    @CurrentCredentials() credentials: Credentials,
    @Param('lobbyId') lobbyId: string,
  ): Promise<LobbyDeatilStatisticsDTO> {
    return this.blackjackService.getLobbyDetailStatistics(credentials.user, lobbyId);
  }
}
