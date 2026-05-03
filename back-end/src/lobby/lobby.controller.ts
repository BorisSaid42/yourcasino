import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentCredentials } from '../auth/decorators/current-credentials.decorator';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { Credentials } from '../auth/dto/jwt-credentials.dto';
import { ServiceError } from '../common/service.error';
import { CreateLobbyDTO } from './dto/create-lobby.dto';
import { EditLobbyDTO } from './dto/edit-lobby.dto';
import { LobbyListDTO } from './dto/lobby-list.dto';
import { LobbyQueryDTO } from './dto/lobby-query.dto';
import { LobbyStatsPaginatedDTO } from './dto/lobby-stats-paginated.dto';
import { LobbyDTO } from './dto/lobby.dto';
import { LobbyService } from './lobby.service';
import { AddBankrollDTO } from './dto/add-bankroll.dto';
import { HttpRateLimitInterceptor } from '../rate-limit/http.interceptor';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { LobbyGameDTO } from './dto/lobby-game.dto';
import { MaintenanceGuard } from 'src/maintenance/guard/maintenance.guard';

@Controller({
  path: '/lobby',
  version: '1',
})
@UseGuards(MaintenanceGuard)
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  @IsPublic()
  @Get('/')
  public async getLobbies(@Query() query: LobbyQueryDTO): Promise<LobbyListDTO> {
    const lobbies = await this.lobbyService.getLobbies(query);

    return lobbies;
  }

  @IsPublic()
  @Get('/:code')
  public async getLobby(@Param('code') code: string): Promise<LobbyDTO> {
    const lobby = await this.lobbyService.getLobbyByCode(code);

    if (!lobby) {
      throw new NotFoundException('Lobby not found');
    }

    return new LobbyDTO(lobby);
  }

  @Get('/id/:lobbyId')
  public async getLobbyById(@Param('lobbyId') lobbyId: string): Promise<LobbyDTO> {
    const lobby = await this.lobbyService.getLobbyById(lobbyId);

    if (!lobby) {
      throw new NotFoundException('Lobby not found');
    }

    return new LobbyDTO(lobby);
  }

  @Get('/manage/stats')
  public async getLobbyStats(
    @CurrentCredentials() credentials: Credentials,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<LobbyStatsPaginatedDTO> {
    return this.lobbyService.getLobbyStats(credentials.user, page, limit);
  }

  @Post('/')
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('lobby:create:new', 3)
  public async createLobby(
    @Body() body: CreateLobbyDTO,
    @CurrentCredentials() credentials: Credentials,
  ): Promise<LobbyDTO> {
    try {
      const lobby = await this.lobbyService.createLobby(body, credentials.user);

      return new LobbyDTO(lobby);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }

      throw e;
    }
  }

  @Put('/:lobbyId')
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('lobby:data:change', 3)
  public async editLobby(
    @Body() body: EditLobbyDTO,
    @Param('lobbyId') lobbyId: string,
    @CurrentCredentials() credentials: Credentials,
  ) {
    try {
      await this.lobbyService.editLobby(lobbyId, body, credentials.user);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }

      throw e;
    }
  }

  @Put('/bankroll/:lobbyId')
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('lobby:bankroll:change', 2)
  public async addBankroll(
    @Body() body: AddBankrollDTO,
    @Param('lobbyId') lobbyId: string,
    @CurrentCredentials() credentials: Credentials,
  ) {
    try {
      await this.lobbyService.addBankroll(lobbyId, body, credentials.user);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }

      throw e;
    }
  }

  @Put('/deactivate/:lobbyId')
  public async deactivateLobby(@Param('lobbyId') lobbyId: string, @CurrentCredentials() credentials: Credentials) {
    try {
      await this.lobbyService.deactivate(lobbyId, credentials.user);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Put('/game/deactivate/:lobbyId')
  public async deactivateLobbyGame(
    @Param('lobbyId') lobbyId: string,
    @Body() payload: LobbyGameDTO,
    @CurrentCredentials() credentials: Credentials,
  ) {
    try {
      await this.lobbyService.deactivateGame(lobbyId, payload.game, credentials.user);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Put('/pause/:lobbyId')
  public async pauseLobby(@Param('lobbyId') lobbyId: string, @CurrentCredentials() credentials: Credentials) {
    try {
      await this.lobbyService.pause(lobbyId, credentials.user);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Put('/activate/:lobbyId')
  public async activateLobby(@Param('lobbyId') lobbyId: string, @CurrentCredentials() credentials: Credentials) {
    try {
      await this.lobbyService.activate(lobbyId, credentials.user);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }
}
