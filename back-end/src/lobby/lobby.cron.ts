import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LobbyState } from './lobby.entity';
import { LobbyService } from './lobby.service';

@Injectable()
export class LobbyCron {
  constructor(private readonly lobbyService: LobbyService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async clearInsufficientLobbies() {
    const lobbiesToRemove = await this.lobbyService.getInsufficientLobbies();

    if (lobbiesToRemove.length <= 0) return;

    for (const lobby of lobbiesToRemove) {
      lobby.status = LobbyState.INACTIVE;
    }

    await this.lobbyService.save(lobbiesToRemove);
  }
}
