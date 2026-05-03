import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LobbyTransaction, TransactionType } from './lobby-transaction.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { GameType } from '../../lobby/dto/lobby-game.dto';

@Injectable()
export class LobbyTransactionService {
  constructor(
    @InjectRepository(LobbyTransaction) private readonly lobbyTransactionRepository: Repository<LobbyTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  async logTransaction(
    lobbyId: string,
    type: TransactionType,
    game: GameType,
    amount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const run = async (m: EntityManager) => {
      const amountInCents = Math.round(amount * 100);

      const transaction = m.create(LobbyTransaction, {
        lobby: { id: lobbyId },
        type,
        game,
        amount: amountInCents,
      });

      await m.save(transaction);
    };

    if (manager) return run(manager);
    return this.dataSource.transaction(run);
  }

  async getTransactionsByLobby(lobbyId: string, limit = 50): Promise<LobbyTransaction[]> {
    return this.lobbyTransactionRepository.find({
      where: { lobbyId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getTransactionsByLobbyAndGame(lobbyId: string, game: GameType, limit = 50): Promise<LobbyTransaction[]> {
    return this.lobbyTransactionRepository.find({
      where: { lobbyId, game },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getTransactionsByType(lobbyId: string, type: TransactionType, limit = 50): Promise<LobbyTransaction[]> {
    return this.lobbyTransactionRepository.find({
      where: { lobbyId, type },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
