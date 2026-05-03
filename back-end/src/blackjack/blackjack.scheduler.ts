import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SocketDispatcher } from '../socket/dispatcher/dispatcher';
import { DealingEvent } from './blackjack.service';
import { BlackjackGame } from './blackjack-game.entity';

@Injectable()
export class BlackjackScheduler {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly dispatcher: SocketDispatcher,
  ) {}

  public delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  public async scheduleDealingSequence(
    game: BlackjackGame,
    dealingEvents: DealingEvent[],
    interval = 500,
  ): Promise<void> {
    if (dealingEvents.length === 0) {
      this.dispatcher.emitBlackjackGameUpdate(game);
      return;
    }

    await new Promise<void>((resolve) => {
      let completed = 0;

      dealingEvents.forEach((event, index) => {
        const delay = index * interval;

        const timeout = setTimeout(() => {
          this.dispatcher.emitCardDealt(game.lobbyId, event.recipient, event.hand);

          completed++;
          if (completed === dealingEvents.length) {
            this.dispatcher.emitBlackjackGameUpdate(game);
            resolve();
          }
        }, delay);

        const timeoutKey = `dealing-${game.lobbyId}-${index}`;
        if (this.schedulerRegistry.doesExist('timeout', timeoutKey)) {
          this.schedulerRegistry.deleteTimeout(timeoutKey);
        }
        this.schedulerRegistry.addTimeout(timeoutKey, timeout);
      });
    });
  }
}
