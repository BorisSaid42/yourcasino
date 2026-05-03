import { Injectable, Logger } from '@nestjs/common';
import { RouletteService } from './roulette.service';
import { RouletteManager } from './roulette.manager';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RouletteCron {
  private readonly logger = new Logger('RouletteCron');

  constructor(
    private readonly rouletteService: RouletteService,
    private readonly rouletteManager: RouletteManager,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async resolveStuckRouletteGames() {
    const resolvedRouletteGames = await this.rouletteService.findStuckRouletteGames();

    for (const rouletteGame of resolvedRouletteGames.stuckPlayingGames) {
      try {
        this.logger.warn(`Found stuck PLAYING game ${rouletteGame.id} in lobby ${rouletteGame.lobbyId}`);
        this.rouletteManager.scheduleStateTransition(rouletteGame.lobbyId, 0);
      } catch (error) {
        this.logger.error(`Failed to resolve stuck PLAYING game ${rouletteGame.id}:`, error);
      }
    }

    for (const rouletteGame of resolvedRouletteGames.stuckBettingGames) {
      try {
        this.logger.warn(`Found stuck COUNTDOWN game ${rouletteGame.id} in lobby ${rouletteGame.lobbyId}`);
        this.rouletteManager.scheduleGameStart(rouletteGame.lobbyId, 0);
      } catch (error) {
        this.logger.error(`Failed to resolve stuck COUNTDOWN game ${rouletteGame.id}:`, error);
      }
    }

    for (const rouletteGame of resolvedRouletteGames.stuckFinishedGames) {
      try {
        this.logger.warn(`Found stuck FINISHED game ${rouletteGame.id} in lobby ${rouletteGame.lobbyId}`);
        this.rouletteManager.scheduleNextGame(rouletteGame.lobbyId, 0);
      } catch (error) {
        this.logger.error(`Failed to resolve stuck FINISHED game ${rouletteGame.id}:`, error);
      }
    }
  }
}
