import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { BlackjackGameStatus } from '../blackjack/blackjack-game.entity';
import { BlackjackHand } from '../blackjack/blackjack-hand.entity';
import { BlackjackPlayer } from './blackjack-player.entity';
import { BetHistoryResultDTO } from './dto/bet-history-paginated.dto';
import { BetHistoryDTO } from './dto/bet-history.dto';
import { LobbyState } from '../lobby/lobby.entity';

@Injectable()
export class BlackjackPlayerService {
  constructor(
    @InjectRepository(BlackjackPlayer) private readonly blackjackPlayerRepository: Repository<BlackjackPlayer>,
    @InjectRepository(BlackjackHand) private readonly blackjackHandRepository: Repository<BlackjackHand>,
  ) {}

  async getById(playerId: string, relations?: string[]): Promise<BlackjackPlayer | null> {
    return this.blackjackPlayerRepository.findOne({
      where: { id: playerId },
      relations,
    });
  }

  async getGamePlayers(gameId: string, relations?: string[]): Promise<BlackjackPlayer[] | null> {
    return this.blackjackPlayerRepository.find({
      where: { game: { id: gameId } },
      relations,
    });
  }

  async getGameUnpayedPlayers(gameId: string, relations?: string[]): Promise<BlackjackPlayer[] | null> {
    return this.blackjackPlayerRepository.find({
      where: { game: { id: gameId }, payedOut: false },
      relations,
    });
  }

  async getCurrentPlayer(userId: string, lobbyId: string, relations?: string[]): Promise<BlackjackPlayer | null> {
    return this.blackjackPlayerRepository.findOne({
      where: { user: { id: userId }, game: { isCurrent: true, lobby: { id: lobbyId } } },
      relations,
    });
  }

  async getPlayerBetHistory(userId: string, page = 1, limit = 10): Promise<BetHistoryResultDTO> {
    const offset = (page - 1) * limit;

    const qb = this.blackjackPlayerRepository
      .createQueryBuilder('player')
      .leftJoin('player.bets', 'bet')
      .leftJoin('player.game', 'game')
      .leftJoin('game.lobby', 'lobby')
      .where('player.user_id = :userId', { userId })
      .andWhere('game.status = :gameStatus', { gameStatus: BlackjackGameStatus.FINISHED })
      .andWhere('bet.amount > 0')
      .select([
        'game.id AS "gameId"',
        'lobby.code AS "lobbyCode"',
        'lobby.status AS "status"',
        'lobby.inviteLink AS "inviteLink"',
        'SUM(bet.amount) AS "totalBet"',
        'SUM(bet.wonAmount) AS "totalWon"',
        'MAX(bet.createdAt) AS "createdAt"',
      ])
      .groupBy('game.id')
      .addGroupBy('lobby.code')
      .addGroupBy('lobby.status')
      .addGroupBy('lobby.inviteLink')
      .orderBy('MAX(bet.createdAt)', 'DESC')
      .limit(limit)
      .offset(offset);

    const results = await qb.getRawMany<BetHistoryDTO>();

    const totalQb = this.blackjackPlayerRepository
      .createQueryBuilder('player')
      .leftJoin('player.game', 'game')
      .where('player.user_id = :userId', { userId })
      .andWhere('game.status = :status', { status: BlackjackGameStatus.FINISHED })
      .select('COUNT(DISTINCT game.id)', 'total');

    const totalRaw = await totalQb.getRawOne<{ total: string }>();
    const total = parseInt(totalRaw?.total ?? '0', 10);

    return new BetHistoryResultDTO({
      data: results.map(
        (row) =>
          new BetHistoryDTO({
            gameId: row.gameId,
            status: row.status,
            lobbyCode: row.lobbyCode,
            inviteLink: row.inviteLink,
            totalBet: Number(row.totalBet),
            totalWon: Number(row.totalWon),
            createdAt: row.createdAt,
          }),
      ),
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  }

  async getTotalPlayerCount(lobbyId: string): Promise<number> {
    const totalPlayersRaw = await this.blackjackPlayerRepository
      .createQueryBuilder('player')
      .select('player.game_id', 'game_id')
      .addSelect('COUNT(DISTINCT player.user_id)', 'playersCount')
      .innerJoin('player.game', 'game')
      .where('game.lobby_id = :lobbyId', { lobbyId })
      .andWhere('game.status = :status', { status: BlackjackGameStatus.FINISHED })
      .groupBy('player.game_id')
      .getRawMany<{ game_id: string; playersCount: string }>();

    return totalPlayersRaw.reduce((sum, g) => sum + Number(g.playersCount), 0);
  }

  async getCurrentPlaying(players: BlackjackPlayer[]): Promise<BlackjackPlayer | null> {
    if (!players) return null;

    const ableToPlay: BlackjackPlayer[] = [];

    for (const player of players) {
      if (player.hands.length === 0) continue;

      for (const hand of player.hands) {
        if (hand?.handTotal === 21) {
          hand.hasStood = true;
          await this.blackjackHandRepository.save(hand);
        }
      }

      const validHands = player.hands.filter((hand) => !hand.isBusted && !hand.hasStood);

      if (validHands && validHands.length > 0) {
        player.currentHandId = validHands[0].id;
        ableToPlay.push(player);
        await this.save(player);
      }
    }

    if (ableToPlay?.length < 1) {
      return null;
    }

    if (ableToPlay?.length === 1) {
      return ableToPlay[0];
    }

    return ableToPlay.sort((p1, p2) => p1.seatIndex - p2.seatIndex)[0];
  }

  async findInactive(): Promise<BlackjackPlayer[]> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    return this.blackjackPlayerRepository.find({
      where: {
        game: {
          status: In([BlackjackGameStatus.COUNTDOWN, BlackjackGameStatus.WAITING_BETS]),
          lobby: {
            status: LobbyState.ACTIVE,
          },
        },
        updatedAt: LessThan(tenMinutesAgo),
      },
      relations: ['game'],
    });
  }

  async save(player: BlackjackPlayer): Promise<BlackjackPlayer> {
    return this.blackjackPlayerRepository.save(player);
  }

  async update(playerId: string, player: Partial<BlackjackPlayer>): Promise<void> {
    await this.blackjackPlayerRepository.update({ id: playerId }, { ...player });
  }

  async savePlayers(players: BlackjackPlayer[]): Promise<void> {
    await this.blackjackPlayerRepository.save(players);
  }

  async updateCurrentHand(playerId: string, handId: string): Promise<void> {
    await this.blackjackPlayerRepository.update({ id: playerId }, { currentHandId: handId });
  }

  async createPlayer(userId: string, gameId: string, seatIndex: number): Promise<BlackjackPlayer> {
    const player = this.blackjackPlayerRepository.create({
      game: { id: gameId },
      user: { id: userId },
      seatIndex: seatIndex,
      bets: [],
    });

    return this.save(player);
  }

  async removePlayer(playerId: string): Promise<void> {
    const player = await this.getById(playerId);
    if (!player) return;
    await this.blackjackPlayerRepository.remove(player);
  }
}
