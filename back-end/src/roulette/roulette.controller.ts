import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RouletteService } from './roulette.service';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { RouletteGameDTO } from './dto/roulette-game.dto';
import { RouletteHistoryDTO } from './dto/roulette-history.dto';
import { CurrentCredentials } from '../auth/decorators/current-credentials.decorator';
import { Credentials } from '../auth/dto/jwt-credentials.dto';
import { RouletteBetDTO } from './dto/roulette-bet.dto';
import { LobbyDeatilStatisticsDTO } from '../lobby/dto/lobby-detail-stats.dto';
import { RouletteFairnessDTO } from './dto/roulette-fairness.dto';
import { FairnessPayloadDTO } from './dto/verify-fairness-payload.dto';
import { FairnessResponseDTO } from './dto/verify-fairness-response.dto';

@Controller({ path: '/roulette', version: '1' })
export class RouletteController {
  constructor(private readonly rouletteService: RouletteService) {}

  @IsPublic()
  @Get('/:lobbyId/current')
  public async getCurrentGame(@Param('lobbyId') lobbyId: string): Promise<RouletteGameDTO | null> {
    const currentRouletteGame = await this.rouletteService.createOrGetActiveGame(lobbyId);

    if (!currentRouletteGame) return null;

    return new RouletteGameDTO(currentRouletteGame);
  }

  @IsPublic()
  @Get('/:lobbyId/history')
  public async getGameHistory(@Param('lobbyId') lobbyId: string): Promise<RouletteHistoryDTO[]> {
    const gameHistory = await this.rouletteService.getGamesHistory(lobbyId);

    if (!gameHistory) return [];

    return gameHistory.map((game) => new RouletteHistoryDTO(game));
  }

  @IsPublic()
  @Get('/:lobbyId/fairness/history')
  public async getFairnessHistoryData(@Param('lobbyId') lobbyId: string): Promise<RouletteFairnessDTO[]> {
    const gameFairnessHistory = await this.rouletteService.findFairnessHistoryGamesByLobbyId(lobbyId);

    return gameFairnessHistory.map((data) => new RouletteFairnessDTO(data));
  }

  @Get('/:lobbyId/bets')
  public async getUserBets(
    @Param('lobbyId') lobbyId: string,
    @CurrentCredentials() credentials: Credentials,
  ): Promise<RouletteBetDTO[]> {
    const gameHistory = await this.rouletteService.getUserBets(lobbyId, credentials.user);

    if (!gameHistory) return [];

    return gameHistory.map((game) => new RouletteBetDTO(game));
  }

  @IsPublic()
  @Get('/:gameId/fairness')
  public async getFairnessData(@Param('gameId') gameId: string): Promise<RouletteFairnessDTO> {
    const gameFairnessData = await this.rouletteService.findFairnessGameById(gameId);

    return new RouletteFairnessDTO(gameFairnessData);
  }

  @IsPublic()
  @Post('/fairness/verify')
  public verifyFairness(@Body() payload: FairnessPayloadDTO): FairnessResponseDTO {
    const result = this.rouletteService.generateRouletteResult(payload.serverSeed, payload.fairnessRandom);

    return new FairnessResponseDTO({
      serverSeed: payload.serverSeed,
      fairnessRandom: payload.fairnessRandom,
      result: result,
    });
  }

  @Get('/user/bets/history')
  async getPlayerBetHistory(
    @CurrentCredentials() credentials: Credentials,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<any> {
    return this.rouletteService.getPlayerBetHistory(credentials.user, page, limit);
  }

  @Get('/stats/:lobbyId')
  public async getLobbyDetailsStatistics(
    @CurrentCredentials() credentials: Credentials,
    @Param('lobbyId') lobbyId: string,
  ): Promise<LobbyDeatilStatisticsDTO> {
    return this.rouletteService.getLobbyDetailStatistics(credentials.user, lobbyId);
  }
}
