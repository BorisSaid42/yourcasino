import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './naming-strategies/snake-case.naming';

export const createDataSourceOptions = (loadMigrations = true): DataSourceOptions => {
  let baseConfig: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 5432),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    namingStrategy: new SnakeNamingStrategy(),
    logging: process.env.DB_SHOULD_LOG === 'true',
    synchronize: false,
    migrationsRun: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };

  if (loadMigrations) {
    baseConfig = {
      ...baseConfig,
      migrations: [`./src/db/migrations/*{.ts,.js}`],
      migrationsTableName: 'migrations',
    };
  }

  return baseConfig;
};
