import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { BlackjackGame, BlackjackGameStatus } from '../../blackjack/blackjack-game.entity';
import { BlackjackGameDTO } from '../../blackjack/dto/blackjack-game.dto';
import { BlackjackHandDTO } from '../../blackjack/dto/blackjack-hand.dto';
import { Lobby, LobbyState } from '../../lobby/lobby.entity';
import { NotificationDTO } from '../../notification/dto/notification.dto';
import { Notification } from '../../notification/notification.entity';
import { RouletteGame, RouletteGameStatus } from '../../roulette/roulette-game.entity';
import { RouletteGameDTO } from '../../roulette/dto/roulette-game.dto';
import { RouletteBetDTO } from '../../roulette/dto/roulette-bet.dto';
import { RouletteBet } from '../../roulette/roulette-bet.entity';
import { RouletteAggregatedBetDTO } from '../../roulette/dto/roulette-aggregated-bet.dto';
import { BlackjackPlayerDTO } from '../../blackjack-player/dto/blackjack-player.dto';
import { BlackjackPlayer } from '../../blackjack-player/blackjack-player.entity';
import { BlackjackBet } from '../../blackjack/blackjack-bet.entity';
import { BlackjackBetDTO } from '../../blackjack/dto/blackjack-bet.dto';

export enum SocketRoom {
  USER = 'user',
  LOBBY = 'lobby',
  BLACKJACK = 'blackjack',
}

@Injectable()
export class SocketDispatcher {
  private server: Server;

  constructor() {}

  public setServer(server: Server) {
    this.server = server;
  }

  public emitPlayerError(userId: string, errorMessage: string) {
    this.server.to(`user:${userId}`).emit('blackjack:error', { errorMessage });
  }

  public emitUserBalanceUpdate(userId: string, balance: number) {
    this.server.to(`user:${userId}`).emit('user:balance', { userId: userId, balance });
  }

  public emitLobbyBankrollUpdate(lobbyId: string, bankroll: number) {
    this.server.to(lobbyId).emit('lobby:update', { bankroll });
  }

  public emitGameStats(lobbyId: string) {
    this.server.to(lobbyId).emit('game:stats:update', { lobbyId });
  }

  public emitLobbyActiveStatusChange(lobbyId: string, code: string, status: LobbyState) {
    this.server.to(lobbyId).emit('lobby:active:status', { lobbyId, code, status });
    this.server.to(`roulette:${lobbyId}`).emit('lobby:active:status', { lobbyId, code, status });
  }

  public emitBlackjackGameUpdate(game: BlackjackGame, isInsuranceTimerActive?: boolean) {
    this.server.to(game.lobbyId).emit('blackjack:game:update', new BlackjackGameDTO(game, isInsuranceTimerActive));
  }

  public emitBlackjackStatusUpdate(lobbyId: string, status: BlackjackGameStatus) {
    this.server.to(lobbyId).emit('blackjack:status:update', { lobbyId, status });
  }

  public emitBlackjackMaxWinNotice(lobbyId: string, userId: string, gameId: string) {
    this.server.to(lobbyId).emit('blackjack:max-win-notice', { lobbyId, userId, gameId });
  }

  public emitBlackjackMaxWinWarning(lobbyId: string, maxWinWarning: boolean) {
    this.server.to(lobbyId).emit('blackjack:max-win-warning', maxWinWarning);
  }

  public emitNextTurn(lobbyId: string, deadline: Date) {
    this.server.to(lobbyId).emit('blackjack:turn:start', { lobbyId, deadline: deadline.toISOString() });
  }

  public emitInsuranceTurn(lobbyId: string, deadline: Date) {
    this.server.to(lobbyId).emit('blackjack:turn:insurance', { lobbyId, deadline: deadline.toISOString() });
  }

  public emitLobbyPlayerCount(lobbyId: string, playerCount: number) {
    this.server.to(lobbyId).emit('lobby:playerCount', playerCount);
  }

  public emitStartCountdown(lobbyId: string, seconds = 10, deadline: Date) {
    this.server.to(lobbyId).emit('blackjack:game:countdown', {
      seconds,
      deadline: deadline.toISOString(),
    });
  }

  public emitDealNowCount(lobbyId: string, dealNowCount?: number) {
    this.server.to(lobbyId).emit('blackjack:game:dealnow', { dealNowCount });
  }

  public emitLobbyEdited(lobbyId: string, lobby: Partial<Lobby>) {
    this.server.to(lobbyId).emit('lobby:update', { ...lobby });
    this.server.to(`roulette:${lobbyId}`).emit('lobby:update', { ...lobby });
  }

  public emitNewNotification(notification: Notification, userId: string) {
    this.server.to(`${SocketRoom.USER}:${userId}`).emit('notification:new', new NotificationDTO(notification));
  }

  public emitNewCryptoNotification(notification: Notification, userId: string) {
    this.server.to(`${SocketRoom.USER}:${userId}`).emit('crypto:notification:new', new NotificationDTO(notification));
  }

  public emitCardDealt(
    lobbyId: string,
    playerId: string,
    hand: BlackjackHandDTO | { handTotal: number; hand: string[] },
  ) {
    this.server.to(lobbyId).emit('blackjack:card-dealt', { lobbyId, playerId, hand });
  }

  public emitPlayerJoined(lobbyId: string, player: BlackjackPlayer) {
    this.server.to(lobbyId).emit('blackjack:player:joined', { player: new BlackjackPlayerDTO(player) });
  }

  public emitPlayerLeave(lobbyId: string, player: BlackjackPlayer) {
    this.server.to(lobbyId).emit('blackjack:player:leave', { playerId: player.id });
  }

  public emitPlayerBet(lobbyId: string, playerId: string, bets: BlackjackBet[]) {
    this.server
      .to(lobbyId)
      .emit('blackjack:player:bet', { playerId: playerId, bets: bets.map((bet) => new BlackjackBetDTO(bet)) });
  }

  public emitBlackjackMaintenanceStatusUpdated(lobbyId: string) {
    this.server.to(lobbyId).emit('blackjack:maintenance-updated', { lobbyId });
  }

  // ROULETTE DISPATCH

  public emitRouletteGameUpdate(game: RouletteGame) {
    this.server.to(`roulette:${game.lobbyId}`).emit('roulette:game:update', new RouletteGameDTO(game));
  }

  public emitRouletteStatusUpdate(lobbyId: string, status: RouletteGameStatus) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:status:update', { lobbyId, status });
  }

  public emitRouletteGameStats(lobbyId: string) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:stats:update', { lobbyId });
  }

  public emitNewRouletteGame(game: RouletteGame) {
    this.server.to(`roulette:${game.lobbyId}`).emit('roulette:new:game', new RouletteGameDTO(game));
  }

  public emitRouletteBallSpin(lobbyId: string) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:gamestart:spin');
  }

  public emitRollNowCount(lobbyId: string, rollNowCount?: number) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:game:rollnow', { rollNowCount });
  }

  public emitStartRouletteCountdown(lobbyId: string, seconds = 10, deadline?: Date) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:game:countdown', {
      seconds,
      deadline: deadline,
    });
  }

  public emitRouletteBetPlaced(lobbyId: string, bet: RouletteBet) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:bet:placed', { lobbyId, bet: new RouletteBetDTO(bet) });
  }

  public emitRouletteMaxWinNotice(lobbyId: string, userId: string, gameId: string) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:max-win-notice', { lobbyId, userId, gameId });
  }

  public emitRouletteMaxWinWarning(lobbyId: string, maxWinWarning: boolean) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:max-win-warning', maxWinWarning);
  }

  public emitRouletteMultipleBetsPlaced(userId: string, lobbyId: string, bets: RouletteBet[]) {
    this.server
      .to(`roulette:${lobbyId}`)
      .emit('roulette:multi-bets:placed', { userId, lobbyId, bets: bets.map((bet) => new RouletteBetDTO(bet)) });
  }

  public emitRouletteUndoBets(userId: string, lobbyId: string, bets: RouletteBet[]) {
    this.server
      .to(`roulette:${lobbyId}`)
      .emit('roulette:bets:undo', { userId, lobbyId, bets: bets.map((bet) => new RouletteBetDTO(bet)) });
  }

  public emitRouletteBetsUpdate(lobbyId: string, aggregatedBets: RouletteAggregatedBetDTO[]) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:bets:update', { lobbyId, bets: aggregatedBets });
  }

  public emitRouletteBankrollUpdate(lobbyId: string, rouletteBankroll: number) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:lobby:update', { rouletteBankroll });
  }

  public emitPlayersUpdate(
    lobbyId: string,
    action: 'add' | 'remove',
    key: 'currentPlayerCount' | 'roulettePlayerCount',
  ) {
    this.server.emit('gamePlayersUpdate', { lobbyId, action, key });
  }

  public emitRouletteMaintenanceStatusUpdated(lobbyId: string) {
    this.server.to(`roulette:${lobbyId}`).emit('roulette:maintenance-updated', { lobbyId });
  }
}
