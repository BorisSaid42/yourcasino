import { Logger, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CurrentSocketCredentials } from '../../auth/decorators/current-socket-credentials.decorator';
import { Credentials, LoggedInCredentials } from '../../auth/dto/jwt-credentials.dto';
import { SocketAuthGuard } from '../../auth/jwt/guards/socket-auth.guard';
import { JWTService } from '../../auth/jwt/jwt.service';
import { BlackjackGameStatus } from '../../blackjack/blackjack-game.entity';
import { BlackjackManager } from '../../blackjack/blackjack.manager';
import { BlackjackService } from '../../blackjack/blackjack.service';
import { ServiceError } from '../../common/service.error';
import { WSValidationPipe } from '../../common/ws-validation.pipe';
import { BlackjackBetDto } from '../../lobby/dto/blackjack-bet.dto';
import { JoinTableDto } from '../../lobby/dto/join-table.dto';
import { LeaveTableDto } from '../../lobby/dto/leave-table.dto';
import { RouletteBetDTO } from '../../lobby/dto/roulette-bet.dto';
import { RouletteRemoveBetDTO } from '../../lobby/dto/roulette-remove-bet.dto';
import { SocketMaintenanceGuard } from '../../maintenance/guard/socket-maintenance.guard';
import { RateLimit } from '../../rate-limit/rate-limit.decorator';
import { WsRateLimitInterceptor } from '../../rate-limit/ws.interceptor';
import { RouletteGameStatus } from '../../roulette/roulette-game.entity';
import { RouletteService } from '../../roulette/roulette.service';
import { RouletteManager } from '../../roulette/roulette.manager';
import { SocketDispatcher, SocketRoom } from '../dispatcher/dispatcher';
import { BlackjackPlayDTO } from './dto/blackjack/blackjack-play.dto';
import { InsurancePayloadDTO } from './dto/blackjack/insurance-payload.dto';
import { LobbyGatewayPayloadDTO } from './dto/lobby-payload.dto';
import { LobbyState } from '../../lobby/lobby.entity';

@UseGuards(SocketMaintenanceGuard)
@WebSocketGateway({ cors: '*' })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly dispatcher: SocketDispatcher,
    private readonly jwtService: JWTService,
    private readonly blackjackService: BlackjackService,
    private readonly blackjackManager: BlackjackManager,
    private readonly rouletteService: RouletteService,
    private readonly rouletteManager: RouletteManager,
  ) {}

  public afterInit() {
    this.dispatcher.setServer(this.server);
  }

  public async handleConnection(socket: Socket) {
    const credentials = this.getSocketUser(socket);
    if (credentials?.user) {
      await socket.join(`${SocketRoom.USER}:${credentials.user}`);
    }
  }

  public async handleDisconnect(socket: Socket) {
    const credentials = this.getSocketUser(socket);
    if (credentials?.user) {
      await socket.leave(`${SocketRoom.USER}:${credentials.user}`);
    }
  }

  private getSocketUser(socket: Socket): Credentials | null {
    const jwt = (socket.handshake.auth as { token?: string }).token?.replace(/^Bearer\s/, '');
    if (!jwt) return null;

    try {
      return this.jwtService.parseJwtToken(jwt);
    } catch (e) {
      Logger.error(e, 'SocketGateway');
      throw new WsException('Invalid JWT');
    }
  }

  @SubscribeMessage('blackjack:room:join')
  public async joinBlackjack(@ConnectedSocket() socket: Socket, @MessageBody() data: LobbyGatewayPayloadDTO) {
    await socket.join(data.lobbyId);
    this.blackjackService.checkForCurrentDealNowCount(data.lobbyId);
  }

  @SubscribeMessage('blackjack:room:leave')
  public async leaveBlackjack(@ConnectedSocket() socket: Socket, @MessageBody() data: LobbyGatewayPayloadDTO) {
    await socket.leave(data.lobbyId);
  }

  @SubscribeMessage('roulette:room:join')
  public async joinRoulette(@ConnectedSocket() socket: Socket, @MessageBody() data: LobbyGatewayPayloadDTO) {
    await socket.join(`roulette:${data.lobbyId}`);
    const count = this.rouletteManager.getRollNowResponseCount(data.lobbyId);
    this.rouletteService.checkForCurrentRollNowCount(data.lobbyId, count);
  }

  @SubscribeMessage('roulette:room:leave')
  public async leaveRoulette(@ConnectedSocket() socket: Socket, @MessageBody() data: LobbyGatewayPayloadDTO) {
    await socket.leave(`roulette:${data.lobbyId}`);
  }

  // BLACKJACK GAME GATEWAY

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:join-leave', 0.7)
  @SubscribeMessage('blackjack:join')
  async handleJoinTable(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: JoinTableDto,
  ) {
    try {
      const game = await this.blackjackService.createOrGetActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (
        game.status !== BlackjackGameStatus.WAITING_PLAYERS &&
        game.status !== BlackjackGameStatus.WAITING_BETS &&
        game.status !== BlackjackGameStatus.COUNTDOWN
      ) {
        throw new ServiceError('You cannot join a game in progress.');
      }

      if (game.players.find((player) => player.userId === credentials.user)) return;

      await this.blackjackService.joinTable(data, credentials.user);

      Logger.debug(`Blackjack (${data.lobbyId}) - User (${credentials?.user}) has joined table`, 'Blackjack');
    } catch (err) {
      Logger.error(`Blackjack join failed: ${err}`, 'Blackjack');
      if (err instanceof ServiceError) {
        throw new WsException(err.message);
      }
      throw new WsException('Blackjack table join failed. Please try again later');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:join-leave', 0.7)
  @SubscribeMessage('blackjack:leave')
  async handleLeave(@CurrentSocketCredentials() credentials: LoggedInCredentials, @MessageBody() data: LeaveTableDto) {
    try {
      const game = await this.blackjackService.createOrGetActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (
        game.status !== BlackjackGameStatus.WAITING_PLAYERS &&
        game.status !== BlackjackGameStatus.WAITING_BETS &&
        game.status !== BlackjackGameStatus.COUNTDOWN
      ) {
        throw new ServiceError('You cannot leave a game in progress.');
      }

      if (!game.players.find((player) => player.userId === credentials.user)) return;

      await this.blackjackService.leaveGame(credentials.user, data.lobbyId);
    } catch (err) {
      Logger.error(`Blackjack leave failed: ${err}`, 'Blackjack');
      if (err instanceof ServiceError) {
        throw new WsException(err.message);
      }
      throw new WsException('Blackjack table leave failed. Please try again later');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @SubscribeMessage('blackjack:bet')
  @RateLimit('blackjack:bet:control', 0.1)
  async handlePlaceBet(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: BlackjackBetDto,
  ) {
    try {
      const { shouldStartCountdown } = await this.blackjackService.placeBet(credentials.user, data);

      if (shouldStartCountdown) {
        const deadline = new Date(Date.now() + 10 * 1000);
        this.dispatcher.emitStartCountdown(data.lobbyId, 10, deadline);
        this.blackjackManager.scheduleGameStart(data.lobbyId, 10);
        this.dispatcher.emitBlackjackStatusUpdate(data.lobbyId, BlackjackGameStatus.COUNTDOWN);
      }

      await this.blackjackService.getCurrentGameAndEmit(data.lobbyId);

      Logger.debug(
        `Blackjack (${data.lobbyId}) - Bet has been placed, amount: ${data.amount}, user: ${credentials.user}`,
        'Blackjack',
      );
    } catch (err) {
      Logger.error(`Blackjack bet error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:bet:dealnow', 2)
  @SubscribeMessage('blackjack:bet:dealnow')
  async handleDealNow(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    try {
      const game = await this.blackjackService.createOrGetActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== BlackjackGameStatus.COUNTDOWN) {
        throw new ServiceError('Deal now function is not available at the moment');
      }

      const playerBetting = game.players?.find((player) => player.userId === credentials.user);

      if (!playerBetting) {
        throw new ServiceError('Player not found');
      }

      const totalBets = playerBetting.bets.reduce((sum, bet) => sum + bet.amount, 0);

      if (playerBetting.bets.length < 1 || totalBets < game.lobby.minBet) {
        return;
      }

      await this.blackjackService.resolvePlayerDealNow(game, playerBetting);

      await this.blackjackService.getCurrentGameAndEmit(data.lobbyId);

      Logger.debug(`Blackjack (${data.lobbyId}) - User (${credentials.user}) has initiated deal now`, 'Blackjack');
    } catch (err) {
      Logger.error(`Blackjack Deal Now error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:insurance', 2)
  @SubscribeMessage('blackjack:insurance')
  async handleInsurance(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: InsurancePayloadDTO,
  ) {
    try {
      if (credentials.user !== data.userId) {
        throw new ServiceError('Unauthorized game play.');
      }

      const game = await this.blackjackService.createOrGetActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== BlackjackGameStatus.PLAYING || !game.dealerHand[0].startsWith('A')) {
        throw new ServiceError('Insurance function is not available at the moment');
      }

      const playerBetting = game.players?.find((player) => player.userId === credentials.user);

      if (!playerBetting) {
        throw new ServiceError('Player not found');
      }

      const insuranceValid = this.blackjackService.checkGameInsuranceValid(game.id, playerBetting.id);
      if (!insuranceValid) throw new ServiceError('Invalid player action.');

      await this.blackjackService.resolvePlayerInsurance(game, playerBetting, data.hasInsured);

      await this.blackjackService.getCurrentGameAndEmit(data.lobbyId);

      Logger.debug(
        `Blackjack (${data.lobbyId}) - Insurance: ${data.hasInsured} by user: ${credentials.user}`,
        'Blackjack',
      );
    } catch (err) {
      Logger.error(`Blackjack insurance error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:bet:control', 0.2)
  @SubscribeMessage('blackjack:bet:rebet')
  async handleRebet(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    try {
      const { shouldStartCountdown, hasNoPreviousBets } = await this.blackjackService.rebet(
        credentials.user,
        data.lobbyId,
      );

      if (hasNoPreviousBets) {
        return;
      }

      if (shouldStartCountdown) {
        const deadline = new Date(Date.now() + 10 * 1000);
        this.dispatcher.emitStartCountdown(data.lobbyId, 10, deadline);
        this.blackjackManager.scheduleGameStart(data.lobbyId, 10);
        this.dispatcher.emitBlackjackStatusUpdate(data.lobbyId, BlackjackGameStatus.COUNTDOWN);
      }

      await this.blackjackService.getCurrentGameAndEmit(data.lobbyId);

      Logger.debug(`Blackjack (${data.lobbyId}) - Rebet has been initiated by user: ${credentials.user}`, 'Blackjack');
    } catch (err) {
      Logger.error(`Blackjack Rebet error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:bet:control', 0.2)
  @SubscribeMessage('blackjack:bet:x2')
  async handleTimes2Bet(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    try {
      await this.blackjackService.doubleBetsControl(credentials.user, data.lobbyId);

      Logger.debug(`Blackjack (${data.lobbyId}) - Bet has been doubled by user: ${credentials.user}`, 'Blackjack');
    } catch (err) {
      Logger.error(`Blackjack X2 error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:bet:control', 0.2)
  @SubscribeMessage('blackjack:bet:undo')
  async handleUndoBet(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    try {
      await this.blackjackService.undoBets(credentials.user, data.lobbyId);

      Logger.debug(`Blackjack (${data.lobbyId}) - Bet undo by user: ${credentials.user}`, 'Blackjack');
    } catch (err) {
      Logger.error(`Blackjack Undo error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:bet:control', 0.2)
  @SubscribeMessage('blackjack:bet:clear')
  async handleClearBet(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    try {
      await this.blackjackService.clearAllBets(credentials.user, data.lobbyId);

      Logger.debug(`Blackjack (${data.lobbyId}) - Bet has been cleared by user: ${credentials.user}`, 'Blackjack');
    } catch (err) {
      Logger.error(`Blackjack Clear error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:hit-stand', 0.7)
  @SubscribeMessage('blackjack:action:hit')
  async handleHit(@CurrentSocketCredentials() credentials: LoggedInCredentials, @MessageBody() data: BlackjackPlayDTO) {
    try {
      if (credentials.user !== data.userId) {
        throw new ServiceError('Unauthorized game play.');
      }

      const insuranceActive = this.blackjackManager.isInsuranceTimerActive(data.lobbyId);
      if (insuranceActive) {
        throw new Error('Cannot perform action while insurance timer is active.');
      }

      const game = await this.blackjackService.createOrGetActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== BlackjackGameStatus.PLAYING || !game.currentPlayerId)
        throw new ServiceError('Invalid player action');

      Logger.debug(`Blackjack (${data.lobbyId}) - Hit by user: ${credentials.user}`, 'Blackjack');
      await this.blackjackService.playerHit(credentials.user, game.id);
      this.blackjackManager.cancelPlayerTimer(game.id, credentials.user);

      this.blackjackManager.scheduleStateTransition(game.lobbyId, 200);
      return;
    } catch (err) {
      Logger.error(`Blackjack hit error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:hit-stand', 0.7)
  @SubscribeMessage('blackjack:action:stand')
  async handleStand(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: BlackjackPlayDTO,
  ) {
    try {
      if (credentials.user !== data.userId) {
        throw new ServiceError('Unauthorized game play.');
      }

      const insuranceActive = this.blackjackManager.isInsuranceTimerActive(data.lobbyId);
      if (insuranceActive) {
        throw new Error('Cannot perform action while insurance timer is active.');
      }

      const game = await this.blackjackService.createOrGetActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== BlackjackGameStatus.PLAYING) throw new ServiceError('Invalid player action');

      Logger.debug(`Blackjack (${data.lobbyId}) - Stand by user: ${credentials.user}`, 'Blackjack');
      await this.blackjackService.playerStand(credentials.user, game);
      this.blackjackManager.cancelPlayerTimer(game.id, credentials.user);

      this.blackjackManager.scheduleStateTransition(game.lobbyId, 200);
      return;
    } catch (err) {
      Logger.error(`Blackjack Stand error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:action:double', 1)
  @SubscribeMessage('blackjack:action:double')
  async handleDoubleDown(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: BlackjackPlayDTO,
  ) {
    try {
      if (credentials.user !== data.userId) {
        throw new ServiceError('Unauthorized game play.');
      }

      const insuranceActive = this.blackjackManager.isInsuranceTimerActive(data.lobbyId);
      if (insuranceActive) {
        throw new Error('Cannot perform action while insurance is pending.');
      }

      const game = await this.blackjackService.createOrGetActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== BlackjackGameStatus.PLAYING) throw new ServiceError('Invalid player action');

      const player = game.players.find((p) => p.userId === credentials.user);
      if (!player) throw new ServiceError('Player not found');

      const currentHand = player.hands.find((h) => h.id === player.currentHandId);
      if (!currentHand) throw new ServiceError('Current hand not found');

      if (!this.blackjackService.canDoubleDown(currentHand)) {
        throw new ServiceError(
          'Cannot double down: must have exactly 2 cards, hand total less than 21, and not already doubled, stood, or split',
        );
      }

      this.blackjackManager.cancelPlayerTimer(game.id, credentials.user);
      await this.blackjackService.playerDoubleDown(credentials.user, game);

      this.blackjackManager.scheduleStateTransition(game.lobbyId, 500);

      Logger.debug(`Blackjack (${data.lobbyId}) - Double down initated by user: ${credentials.user}`, 'Blackjack');
    } catch (err) {
      Logger.error(`Blackjack Double error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @UsePipes(WSValidationPipe)
  @RateLimit('blackjack:action:split', 1)
  @SubscribeMessage('blackjack:action:split')
  async handleSplit(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: BlackjackPlayDTO,
  ) {
    try {
      if (credentials.user !== data.userId) {
        throw new ServiceError('Unauthorized game play.');
      }

      const insuranceActive = this.blackjackManager.isInsuranceTimerActive(data.lobbyId);
      if (insuranceActive) {
        throw new Error('Cannot perform action while insurance timer is active.');
      }

      const game = await this.blackjackService.createOrGetActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== BlackjackGameStatus.PLAYING) throw new ServiceError('Invalid player action');

      const player = game.players.find((p) => p.userId === credentials.user);
      if (!player) throw new ServiceError('Player not found');

      const currentHand = player.hands.find((h) => h.id === player.currentHandId);
      if (!currentHand) throw new ServiceError('Current hand not found');

      if (!this.blackjackService.canSplit(currentHand, player)) {
        throw new ServiceError(
          'Cannot split: must have exactly 2 cards of the same rank, can only split once, and not already doubled or stood',
        );
      }
      this.blackjackManager.cancelPlayerTimer(game.id, credentials.user);
      await this.blackjackService.playerSplit(credentials.user, game);

      await this.blackjackService.getCurrentGameAndEmit(data.lobbyId);
      this.blackjackManager.scheduleStateTransition(game.lobbyId, 500);
      Logger.debug(`Blackjack (${data.lobbyId}) - Split initated by user: ${credentials.user}`, 'Blackjack');
    } catch (err) {
      Logger.error(`Blackjack Split error: ${err}`, 'Blackjack');
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  // ROULETTE GAME GATEWAY

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @RateLimit('roulette:main:bet', 0.1)
  @UsePipes(WSValidationPipe)
  @SubscribeMessage('roulette:bet')
  async handlePlaceRouletteBet(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: RouletteBetDTO,
  ) {
    try {
      const game = await this.rouletteService.getActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== RouletteGameStatus.WAITING_BETS && game.status !== RouletteGameStatus.COUNTDOWN) {
        throw new ServiceError('Betting is not available at the moment');
      }

      const wasWaitingBets = game.status === RouletteGameStatus.WAITING_BETS;

      await this.rouletteService.placeBet(credentials.user, data);

      // Emit aggregated bets update to all clients
      await this.rouletteService.emitAggregatedBetsUpdate(data.lobbyId);

      const prevBets = game.bets.find((bet) => bet.userId === credentials.user);

      if (!prevBets) {
        this.dispatcher.emitPlayersUpdate(data.lobbyId, 'add', 'roulettePlayerCount');
      }

      if (wasWaitingBets) {
        const updatedGame = await this.rouletteService.getActiveGame(data.lobbyId);
        if (!updatedGame) {
          throw new ServiceError('Failed to fetch updated game');
        }

        const userBetTotals = new Map<string, number>();
        for (const bet of updatedGame.bets) {
          const current = userBetTotals.get(bet.userId) || 0;
          userBetTotals.set(bet.userId, current + bet.amount);
        }

        const hasPlayerMetMinimum = Array.from(userBetTotals.values()).some(
          (total) => total >= updatedGame.lobby.rouletteMinBet,
        );

        if (hasPlayerMetMinimum && updatedGame.status === RouletteGameStatus.WAITING_BETS) {
          const deadline = new Date(Date.now() + 10 * 1000);
          await this.rouletteService.update(updatedGame.id, {
            status: RouletteGameStatus.COUNTDOWN,
            timerDeadline: deadline,
            timerType: 'countdown',
          });

          this.dispatcher.emitStartRouletteCountdown(updatedGame.lobbyId, 10, deadline);
          this.dispatcher.emitRouletteStatusUpdate(updatedGame.lobbyId, RouletteGameStatus.COUNTDOWN);

          this.rouletteManager.scheduleGameStart(updatedGame.lobbyId, 10);

          Logger.debug(`Roulette (${data.lobbyId}) - Countdown started`, 'Roulette');
        }
      }
      await this.rouletteService.getCurrentGameAndEmit(data.lobbyId);
    } catch (err) {
      Logger.error(`Roulette place bet error: ${err}`, `Roulette - ${data.lobbyId}`);
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @RateLimit('roulette:bet:rollnow', 3)
  @SubscribeMessage('roulette:bet:rollnow')
  async handleRollNow(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    const lockAcquired = this.rouletteManager.acquireBetOperationLock(data.lobbyId);
    if (!lockAcquired) {
      throw new WsException('Another bet operation is in progress. Please wait.');
    }

    try {
      const game = await this.rouletteService.getActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== RouletteGameStatus.COUNTDOWN) {
        throw new ServiceError('Roll now function is not available at the moment');
      }

      // Check if game has any bets at all
      if (!game.bets || game.bets.length === 0) {
        throw new ServiceError('No bets placed on the table');
      }

      const playerBets = game.bets?.filter((bet) => bet.userId === credentials.user);

      if (!playerBets || playerBets.length <= 0) {
        throw new ServiceError('Player not found');
      }

      const totalBets = playerBets.reduce((sum, bet) => sum + bet.amount, 0);

      if (totalBets < game.lobby.rouletteMinBet) {
        return;
      }

      this.rouletteManager.trackRollNowResponse(game.lobbyId, credentials.user);

      const freshGame = await this.rouletteService.getActiveGame(data.lobbyId);
      if (!freshGame) {
        throw new ServiceError('Game no longer active');
      }

      const distinctGameUsers = this.rouletteService.getDistinctUserIds(freshGame);
      const respondedCount = this.rouletteManager.getRollNowResponseCount(freshGame.lobbyId);

      if (respondedCount >= distinctGameUsers.length && distinctGameUsers.length > 0) {
        await this.rouletteManager.cancelRollNowTimer(freshGame.lobbyId);
        this.rouletteManager.clearRollNowResponses(freshGame.lobbyId);
      }

      Logger.debug(`Roulette (${data.lobbyId}) - Roll now initiated by user: ${credentials.user}`, 'Roulette');
    } catch (err) {
      Logger.error(`Roulette Roll Now error: ${err}`, `Roulette - ${data.lobbyId}`);
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.rouletteManager.releaseBetOperationLock(data.lobbyId);
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @RateLimit('roulette:main:bet', 0.1)
  @UsePipes(WSValidationPipe)
  @SubscribeMessage('roulette:remove:bet')
  async handleRemoveRouletteBet(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: RouletteRemoveBetDTO,
  ) {
    try {
      const game = await this.rouletteService.getActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== RouletteGameStatus.COUNTDOWN && game.status !== RouletteGameStatus.WAITING_BETS) {
        throw new ServiceError('Betting is not available at the moment');
      }

      await this.rouletteService.removeBet(credentials.user, game.id, data);

      // Emit aggregated bets update to all clients
      await this.rouletteService.emitAggregatedBetsUpdate(data.lobbyId);

      const updatedGame = await this.rouletteService.getActiveGame(data.lobbyId);

      if (updatedGame) {
        const userBetTotals = new Map<string, number>();
        for (const bet of updatedGame.bets) {
          const current = userBetTotals.get(bet.userId) || 0;
          userBetTotals.set(bet.userId, current + bet.amount);
        }

        const hasPlayerMetMinimum = Array.from(userBetTotals.values()).some(
          (total) => total >= updatedGame.lobby.rouletteMinBet,
        );

        if (updatedGame.status === RouletteGameStatus.COUNTDOWN && !hasPlayerMetMinimum) {
          await this.rouletteService.update(updatedGame.id, { status: RouletteGameStatus.WAITING_BETS });
          this.rouletteManager.cancelGameStart(data.lobbyId);
          this.dispatcher.emitRouletteStatusUpdate(data.lobbyId, RouletteGameStatus.WAITING_BETS);
          Logger.debug(`Roulette (${data.lobbyId}) - Countdown cancelled, no player meets minimum bet`, 'Roulette');
        }
      }

      Logger.debug(
        `Roulette (${data.lobbyId}) - Bet has been removed from ${data.betPlace}, by user: ${credentials.user}`,
        'Roulette',
      );
    } catch (err) {
      Logger.error(`Roulette remove bet error: ${err}`, `Roulette - ${data.lobbyId}`);
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @RateLimit('roulette:bet:control', 0.2)
  @SubscribeMessage('roulette:bet:rebet')
  async handleRouletteRebet(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    const lockAcquired = this.rouletteManager.acquireBetOperationLock(data.lobbyId);
    if (!lockAcquired) {
      throw new WsException('Another bet operation is in progress. Please wait.');
    }

    try {
      const game = await this.rouletteService.getActiveGame(data.lobbyId);

      if (!game) {
        throw new ServiceError('No game found');
      }

      if (game.lobby.status !== LobbyState.ACTIVE) {
        throw new ServiceError('Lobby is not active');
      }

      if (game.status !== RouletteGameStatus.WAITING_BETS && game.status !== RouletteGameStatus.COUNTDOWN) {
        throw new ServiceError('Betting is not available at the moment');
      }

      const wasWaitingBets = game.status === RouletteGameStatus.WAITING_BETS;

      await this.rouletteService.handleRebet(credentials.user, game);

      // Emit aggregated bets update to all clients
      await this.rouletteService.emitAggregatedBetsUpdate(data.lobbyId);

      if (wasWaitingBets) {
        const updatedGame = await this.rouletteService.getActiveGame(data.lobbyId);
        if (!updatedGame) {
          throw new ServiceError('Failed to fetch updated game');
        }

        const userBetTotals = new Map<string, number>();
        for (const bet of updatedGame.bets) {
          const current = userBetTotals.get(bet.userId) || 0;
          userBetTotals.set(bet.userId, current + bet.amount);
        }

        const hasPlayerMetMinimum = Array.from(userBetTotals.values()).some(
          (total) => total >= game.lobby.rouletteMinBet,
        );

        if (hasPlayerMetMinimum && updatedGame.status === RouletteGameStatus.WAITING_BETS) {
          const deadline = new Date(Date.now() + 10 * 1000);
          await this.rouletteService.update(updatedGame.id, {
            status: RouletteGameStatus.COUNTDOWN,
            timerDeadline: deadline,
            timerType: 'countdown',
          });

          this.dispatcher.emitStartRouletteCountdown(updatedGame.lobbyId, 10, deadline);
          this.dispatcher.emitRouletteStatusUpdate(updatedGame.lobbyId, RouletteGameStatus.COUNTDOWN);

          this.rouletteManager.scheduleGameStart(updatedGame.lobbyId, 10);

          await this.rouletteService.getCurrentGameAndEmit(game.lobbyId);
        }
      }

      Logger.debug(`Roulette (${data.lobbyId}) - Rebet has been initiated by user: ${credentials.user}`, 'Roulette');
    } catch (err) {
      Logger.error(`Roulette rebet error: ${err}`, `Roulette - ${data.lobbyId}`);
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.rouletteManager.releaseBetOperationLock(data.lobbyId);
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @RateLimit('roulette:bet:control', 0.2)
  @SubscribeMessage('roulette:bet:undo')
  async handleRouletteUndo(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    const lockAcquired = this.rouletteManager.acquireBetOperationLock(data.lobbyId);
    if (!lockAcquired) {
      throw new WsException('Another bet operation is in progress. Please wait.');
    }

    try {
      await this.rouletteService.handleUndoBet(credentials.user, data.lobbyId);

      // Emit aggregated bets update to all clients
      await this.rouletteService.emitAggregatedBetsUpdate(data.lobbyId);

      const updatedGame = await this.rouletteService.getActiveGame(data.lobbyId);
      if (updatedGame) {
        const playerBets = updatedGame.bets?.filter((bet) => bet.userId === credentials.user);
        const totalPlayerBets = playerBets?.reduce((sum, bet) => sum + bet.amount, 0) || 0;

        if (totalPlayerBets < updatedGame.lobby.rouletteMinBet) {
          const rollNowResponses = this.rouletteManager.getRollNowResponses(data.lobbyId);
          if (rollNowResponses?.has(credentials.user)) {
            rollNowResponses.delete(credentials.user);
            const count = this.rouletteManager.getRollNowResponseCount(data.lobbyId);
            this.rouletteService.checkForCurrentRollNowCount(data.lobbyId, count);
          }
        }

        const userBetTotals = new Map<string, number>();
        for (const bet of updatedGame.bets) {
          const current = userBetTotals.get(bet.userId) || 0;
          userBetTotals.set(bet.userId, current + bet.amount);
        }

        const hasPlayerMetMinimum = Array.from(userBetTotals.values()).some(
          (total) => total >= updatedGame.lobby.rouletteMinBet,
        );

        if (updatedGame.status === RouletteGameStatus.COUNTDOWN && !hasPlayerMetMinimum) {
          await this.rouletteService.update(updatedGame.id, { status: RouletteGameStatus.WAITING_BETS });
          this.rouletteManager.cancelGameStart(data.lobbyId);
          this.dispatcher.emitRouletteStatusUpdate(data.lobbyId, RouletteGameStatus.WAITING_BETS);
          Logger.debug(`Roulette (${data.lobbyId}) - Countdown cancelled, no player meets minimum bet`, 'Roulette');
        }
      }

      Logger.debug(`Roulette (${data.lobbyId}) - Bet undo by user: ${credentials.user}`, 'Roulette');
    } catch (err) {
      Logger.error(`Roulette undo bet error: ${err}`, `Roulette - ${data.lobbyId}`);
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.rouletteManager.releaseBetOperationLock(data.lobbyId);
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @RateLimit('roulette:bet:control', 0.2)
  @SubscribeMessage('roulette:bet:clear')
  async handleRouletteClear(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    const lockAcquired = this.rouletteManager.acquireBetOperationLock(data.lobbyId);
    if (!lockAcquired) {
      throw new WsException('Another bet operation is in progress. Please wait.');
    }

    try {
      await this.rouletteService.handleClearBets(credentials.user, data.lobbyId);

      // Emit aggregated bets update to all clients
      await this.rouletteService.emitAggregatedBetsUpdate(data.lobbyId);

      const rollNowResponses = this.rouletteManager.getRollNowResponses(data.lobbyId);
      if (rollNowResponses?.has(credentials.user)) {
        rollNowResponses.delete(credentials.user);
      }

      const updatedGame = await this.rouletteService.getActiveGame(data.lobbyId);
      if (updatedGame) {
        const userBetTotals = new Map<string, number>();
        for (const bet of updatedGame.bets) {
          const current = userBetTotals.get(bet.userId) || 0;
          userBetTotals.set(bet.userId, current + bet.amount);
        }

        const hasPlayerMetMinimum = Array.from(userBetTotals.values()).some(
          (total) => total >= updatedGame.lobby.rouletteMinBet,
        );

        if (updatedGame.status === RouletteGameStatus.COUNTDOWN && !hasPlayerMetMinimum) {
          await this.rouletteService.update(updatedGame.id, { status: RouletteGameStatus.WAITING_BETS });
          this.rouletteManager.cancelGameStart(data.lobbyId);
          this.dispatcher.emitRouletteStatusUpdate(data.lobbyId, RouletteGameStatus.WAITING_BETS);
          Logger.debug(`Roulette (${data.lobbyId}) - Countdown cancelled, no player meets minimum bet`, 'Roulette');
        }
      }

      const count = this.rouletteManager.getRollNowResponseCount(data.lobbyId);
      this.rouletteService.checkForCurrentRollNowCount(data.lobbyId, count);

      Logger.debug(`Roulette (${data.lobbyId}) - Bet has been cleared by user: ${credentials.user}`, 'Roulette');
    } catch (err) {
      Logger.error(`Roulette clear bets error: ${err}`, `Roulette - ${data.lobbyId}`);
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.rouletteManager.releaseBetOperationLock(data.lobbyId);
    }
  }

  @UseInterceptors(WsRateLimitInterceptor)
  @UseGuards(SocketAuthGuard)
  @RateLimit('roulette:bet:control', 0.2)
  @SubscribeMessage('roulette:bet:x2')
  async handleRouletteX2(
    @CurrentSocketCredentials() credentials: LoggedInCredentials,
    @MessageBody() data: LobbyGatewayPayloadDTO,
  ) {
    const lockAcquired = this.rouletteManager.acquireBetOperationLock(data.lobbyId);
    if (!lockAcquired) {
      throw new WsException('Another bet operation is in progress. Please wait.');
    }

    try {
      await this.rouletteService.handleX2Bets(credentials.user, data.lobbyId);

      // Emit aggregated bets update to all clients
      await this.rouletteService.emitAggregatedBetsUpdate(data.lobbyId);

      Logger.debug(`Roulette (${data.lobbyId}) - Bet has been doubled by user: ${credentials.user}`, 'Roulette');
    } catch (err) {
      Logger.error(`Roulette x2 bet error: ${err}`, `Roulette - ${data.lobbyId}`);
      throw new WsException(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.rouletteManager.releaseBetOperationLock(data.lobbyId);
    }
  }
}
