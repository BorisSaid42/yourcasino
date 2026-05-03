import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LobbyModule } from '../lobby/lobby.module';
import { SocketDispatcherModule } from '../socket/dispatcher/dispatcher.module';
import { UserModule } from '../user/user.module';
import { RouletteBet } from './roulette-bet.entity';
import { RouletteGame } from './roulette-game.entity';
import { RouletteController } from './roulette.controller';
import { RouletteService } from './roulette.service';
import { RandomOrgModule } from '../random-org/random-org.module';
import { RouletteManager } from './roulette.manager';
import { RouletteCron } from './roulette.cron';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RouletteBet, RouletteGame]),
    UserModule,
    LobbyModule,
    SocketDispatcherModule,
    RandomOrgModule,
    MaintenanceModule,
  ],
  controllers: [RouletteController],
  providers: [RouletteService, RouletteManager, RouletteCron],
  exports: [RouletteService, RouletteManager],
})
export class RouletteModule {}
