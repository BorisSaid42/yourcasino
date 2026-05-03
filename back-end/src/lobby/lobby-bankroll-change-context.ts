import { TransactionType } from '../transaction/lobby/lobby-transaction.entity';

export type LobbyBankrollChangeContext = {
  gameId?: string;
  reason?: string;
  logType?: TransactionType;
};
