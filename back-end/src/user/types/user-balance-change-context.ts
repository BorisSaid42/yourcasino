import { BalanceLogType } from '../user-balance-log.entity';

export type UserBalanceChangeContext = {
  logType?: BalanceLogType;
  gameId?: string;
  gameType?: 'blackjack' | 'roulette';
  playerId?: string;
  reason?: string;
  lobbyId?: string;
  relatedTransactionId?: string;
};
