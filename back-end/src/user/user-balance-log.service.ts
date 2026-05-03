import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserBalanceLog, BalanceLogType } from './user-balance-log.entity';
import { User } from './user.entity';
import { Lobby } from '../lobby/lobby.entity';

export interface CreateBalanceLogOptions {
  userId: string;
  type: BalanceLogType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  lobbyId?: string;
  gameId?: string;
  gameType?: 'blackjack' | 'roulette';
  playerId?: string;
  reason?: string;
  relatedTransactionId?: string;
}

@Injectable()
export class UserBalanceLogService {
  constructor(
    @InjectRepository(UserBalanceLog)
    private readonly balanceLogRepository: Repository<UserBalanceLog>,
  ) {}

  async createLog(options: CreateBalanceLogOptions, manager?: EntityManager): Promise<UserBalanceLog> {
    const repository = manager ? manager.getRepository(UserBalanceLog) : this.balanceLogRepository;

    const log = repository.create({
      user: { id: options.userId } as User,
      type: options.type,
      amount: options.amount,
      balanceBefore: options.balanceBefore,
      balanceAfter: options.balanceAfter,
      lobby: options.lobbyId ? ({ id: options.lobbyId } as Lobby) : null,
      gameId: options.gameId ?? null,
      gameType: options.gameType ?? null,
      playerId: options.playerId ?? null,
      reason: options.reason ?? null,
      relatedTransactionId: options.relatedTransactionId ?? null,
    });

    return repository.save(log);
  }
}
