import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './naming-strategies/snake-case.naming.js';
import { User } from '../entities/user.entity.js';
import { UserTransaction } from '../entities/transaction.entity.js';
import { BlackjackBet } from '../entities/blackjack-bet.entity.js';
import { RouletteBet } from '../entities/roulette-bet.entity.js';
import { VerificationEntity } from '../entities/verification.entity.js';
import { RouletteGame } from '../entities/roulette-game.entity.js';
import { BlackjackGame } from '../entities/blackjack-game.entity.js';
import { Lobby } from '../entities/lobby.entity.js';
import { BlackjackPlayer } from '../entities/blackjack-player.entity.js';
import { BlackjackHand } from '../entities/blackjack-hand.js';
import { Maintenance } from '../entities/maintenance.entity.js';
import { AssetRateCache } from '../entities/asset-rate-cache.entity.js';
import { LobbyTransaction } from '../entities/lobby-transaction.entity.js';

const config: DataSourceOptions = {
  type: process.env.DATABASE_DIALECT as any,
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'yourcasino_pass',
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    User,
    UserTransaction,
    BlackjackBet,
    RouletteBet,
    VerificationEntity,
    RouletteGame,
    BlackjackGame,
    Lobby,
    LobbyTransaction,
    BlackjackPlayer,
    BlackjackHand,
    AssetRateCache,
    Maintenance,
  ],
  migrations: [],
  migrationsRun: false,
  migrationsTableName: 'migrations',
  migrationsTransactionMode: 'all',
  subscribers: [],
};

export default config;
