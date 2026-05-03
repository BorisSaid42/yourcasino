import { Expose } from 'class-transformer';
import { BlackjackHand } from '../blackjack-hand.entity';

export class BlackjackHandDTO {
  @Expose()
  public id: string;

  @Expose()
  public hand: string[];

  @Expose()
  public handTotal: number;

  @Expose()
  public hasStood: boolean;

  @Expose()
  public isBusted: boolean;

  @Expose()
  public hasDoubled: boolean;

  @Expose()
  public hasSplitted: boolean;

  @Expose()
  public isDoubledRevealed: boolean;

  @Expose()
  public handIndex: number;

  constructor(data: BlackjackHand) {
    this.id = data.id;
    this.hand = data.hand;
    this.handTotal = data?.handTotal || 0;
    this.hasStood = data.hasStood;
    this.isBusted = data.isBusted;
    this.hasDoubled = data.hasDoubled;
    this.hasSplitted = data.hasSplitted;
    this.isDoubledRevealed = data.isDoubledRevealed;
    this.handIndex = data.handIndex;
  }
}
