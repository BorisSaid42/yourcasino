import { Expose } from 'class-transformer';
import { BlackjackPlayer } from '../blackjack-player.entity';
import { BlackjackBetDTO } from '../../blackjack/dto/blackjack-bet.dto';
import { BlackjackHandDTO } from '../../blackjack/dto/blackjack-hand.dto';

export class BlackjackPlayerDTO {
  @Expose()
  public id: string;

  @Expose()
  public userId: string;

  @Expose()
  public username: string;

  @Expose()
  public insured: boolean;

  @Expose()
  public seatIndex: number;

  @Expose()
  public currentHandId: string;

  @Expose()
  public bets: BlackjackBetDTO[];

  @Expose()
  public hands: BlackjackHandDTO[];

  constructor(data: BlackjackPlayer) {
    this.bets = data.bets?.map((bet) => new BlackjackBetDTO(bet)) || [];
    this.hands = data.hands?.map((hand) => new BlackjackHandDTO(hand)) || [];
    this.id = data.id;
    this.userId = data.userId;
    this.insured = data.insured;
    this.username = data.user?.username;
    this.seatIndex = data.seatIndex;
    this.currentHandId = data.currentHandId;
  }
}
