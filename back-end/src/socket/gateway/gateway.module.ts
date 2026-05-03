import { Module } from '@nestjs/common';
import { JWTModule } from '../../auth/jwt/jwt.module';
import { RateLimitModule } from '../../rate-limit/rate-limit.module';
import { SocketDispatcherModule } from '../dispatcher/dispatcher.module';
import { SocketGateway } from './gateway';
import { BlackjackModule } from '../../blackjack/blackjack.module';
import { RouletteModule } from '../../roulette/roulette.module';
import { MaintenanceModule } from '../../maintenance/maintenance.module';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [
    JWTModule,
    UserModule,
    RateLimitModule,
    SocketDispatcherModule,
    BlackjackModule,
    RouletteModule,
    MaintenanceModule,
  ],
  providers: [SocketGateway],
})
export class SocketGatewayModule {}
