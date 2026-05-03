import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BlackjackPlayer } from '../../blackjack-player/blackjack-player.entity';
import { BlackjackBet } from '../../blackjack/blackjack-bet.entity';
import { BlackjackGame } from '../../blackjack/blackjack-game.entity';
import { BlackjackHand } from '../../blackjack/blackjack-hand.entity';
import { Lobby } from '../../lobby/lobby.entity';
import { Notification } from '../../notification/notification.entity';
import { UserTransaction } from '../../transaction/user-transaction.entity';
import { UserWallet } from '../../user/user-wallet.entity';
import { User } from '../../user/user.entity';
import { createDataSourceOptions } from './data-source.config';
import { RouletteGame } from '../../roulette/roulette-game.entity';
import { RouletteBet } from '../../roulette/roulette-bet.entity';
import { VerificationEntity } from 'src/verification/verification.entity';
import { AssetRateCache } from '../../fireblocks/asset-rate-cache.entity';
import { Maintenance } from '../../maintenance/maintenance.entity';
import { UserBalanceLog } from '../../user/user-balance-log.entity';
import { LobbyTransaction } from '../../transaction/lobby/lobby-transaction.entity';

export const createDbConfig = (): TypeOrmModuleOptions => ({
  ...createDataSourceOptions(false),
  entities: [
    User,
    UserWallet,
    UserTransaction,
    UserBalanceLog,
    Lobby,
    LobbyTransaction,
    BlackjackBet,
    BlackjackGame,
    BlackjackPlayer,
    BlackjackHand,
    RouletteGame,
    RouletteBet,
    Notification,
    VerificationEntity,
    AssetRateCache,
    Maintenance,
  ],
});
