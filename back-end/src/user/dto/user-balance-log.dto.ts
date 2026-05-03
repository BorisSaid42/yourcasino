import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BalanceLogType } from '../user-balance-log.entity';

export class GetUserBalanceLogsQueryDTO {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(BalanceLogType)
  type?: BalanceLogType;

  @IsOptional()
  lobbyId?: string;

  @IsOptional()
  @IsEnum(['blackjack', 'roulette'])
  gameType?: 'blackjack' | 'roulette';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UserBalanceLogDTO {
  id: string;
  type: BalanceLogType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  lobbyId: string | null;
  lobbyName: string | null;
  gameId: string | null;
  gameType: 'blackjack' | 'roulette' | null;
  playerId: string | null;
  reason: string | null;
  relatedTransactionId: string | null;
  createdAt: Date;

  constructor(partial: Partial<UserBalanceLogDTO>) {
    Object.assign(this, partial);
  }
}

export class UserBalanceLogsResponseDTO {
  data: UserBalanceLogDTO[];
  total: number;
  page: number;
  totalPages: number;

  constructor(partial: Partial<UserBalanceLogsResponseDTO>) {
    Object.assign(this, partial);
  }
}

export class UserBalanceStatsDTO {
  totalDeposits: number;
  totalWithdrawals: number;
  totalBetsPlaced: number;
  totalWinnings: number;
  totalLosses: number;
  netProfit: number;

  constructor(partial: Partial<UserBalanceStatsDTO>) {
    Object.assign(this, partial);
  }
}
