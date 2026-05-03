import { Expose } from 'class-transformer';
import { getSha256 } from '../../common/utils';
import { BlackjackGame, BlackjackGameStatus } from '../blackjack-game.entity';

export class BlackjackFairnessDTO {
  @Expose()
  public id: string;

  @Expose()
  public serverSeed: string;

  @Expose()
  public serverSeedHash: string;

  @Expose()
  public fairnessRandom: string;

  @Expose()
  public numOfDecks: number;

  @Expose()
  public deck: string[];

  @Expose()
  public updatedAt: Date;

  constructor(game: BlackjackGame) {
    this.id = game.id;
    if (game.status === BlackjackGameStatus.FINISHED) {
      this.serverSeed = game.serverSeed;
    }
    this.serverSeedHash = getSha256(game.serverSeed);
    this.deck = game.fullDeck;
    this.numOfDecks = game.numOfDecks;
    this.fairnessRandom = game.fairnessRandom;
    this.updatedAt = game.updatedAt;
  }
}
