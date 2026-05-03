import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDateColumnsToTimestampz1758192231283 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE blackjack_players
        ALTER COLUMN created_at TYPE timestamptz
        USING created_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE blackjack_players
        ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE users
        ALTER COLUMN created_at TYPE timestamptz
        USING created_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE users
        ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE users
        ALTER COLUMN email_verified_at TYPE timestamptz
        USING email_verified_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE lobbies
        ALTER COLUMN created_at TYPE timestamptz
        USING created_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE lobbies
        ALTER COLUMN updated_at TYPE timestamptz
        USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_games
          ALTER COLUMN created_at TYPE timestamptz
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_games
          ALTER COLUMN updated_at TYPE timestamptz
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE blackjack_games
        ALTER COLUMN bet_deadline TYPE timestamptz
        USING bet_deadline::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_bets
          ALTER COLUMN created_at TYPE timestamptz
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_bets
          ALTER COLUMN updated_at TYPE timestamptz
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_hands
          ALTER COLUMN created_at TYPE timestamptz
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_hands
          ALTER COLUMN updated_at TYPE timestamptz
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE user_wallets
          ALTER COLUMN created_at TYPE timestamptz
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE user_wallets
          ALTER COLUMN updated_at TYPE timestamptz
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE user_transactions
          ALTER COLUMN created_at TYPE timestamptz
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE user_transactions
          ALTER COLUMN updated_at TYPE timestamptz
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE notifications
          ALTER COLUMN created_at TYPE timestamptz
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE notifications
          ALTER COLUMN updated_at TYPE timestamptz
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE roulette_games
          ALTER COLUMN created_at TYPE timestamptz
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE roulette_games
          ALTER COLUMN updated_at TYPE timestamptz
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE roulette_bets
          ALTER COLUMN created_at TYPE timestamptz
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE roulette_bets
          ALTER COLUMN updated_at TYPE timestamptz
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE code_verifications
          ALTER COLUMN created_at TYPE timestamptz
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE code_verifications
          ALTER COLUMN updated_at TYPE timestamptz
          USING updated_at::timestamp;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE blackjack_players
        ALTER COLUMN created_at TYPE timestamp
        USING created_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE blackjack_players
        ALTER COLUMN updated_at TYPE timestamp
        USING updated_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE users
        ALTER COLUMN created_at TYPE timestamp
        USING created_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE users
        ALTER COLUMN updated_at TYPE timestamp
        USING updated_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE users
        ALTER COLUMN email_verified_at TYPE timestamp
        USING email_verified_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE lobbies
        ALTER COLUMN created_at TYPE timestamp
        USING created_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE lobbies
        ALTER COLUMN updated_at TYPE timestamp
        USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_games
          ALTER COLUMN created_at TYPE timestamp
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_games
          ALTER COLUMN updated_at TYPE timestamp
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
        ALTER TABLE blackjack_games
        ALTER COLUMN bet_deadline TYPE timestamp
        USING bet_deadline::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_bets
          ALTER COLUMN created_at TYPE timestamp
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_bets
          ALTER COLUMN updated_at TYPE timestamp
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_hands
          ALTER COLUMN created_at TYPE timestamp
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE blackjack_hands
          ALTER COLUMN updated_at TYPE timestamp
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE user_wallets
          ALTER COLUMN created_at TYPE timestamp
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE user_wallets
          ALTER COLUMN updated_at TYPE timestamp
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE user_transactions
          ALTER COLUMN created_at TYPE timestamp
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE user_transactions
          ALTER COLUMN updated_at TYPE timestamp
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE notifications
          ALTER COLUMN created_at TYPE timestamp
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE notifications
          ALTER COLUMN updated_at TYPE timestamp
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE roulette_games
          ALTER COLUMN created_at TYPE timestamp
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE roulette_games
          ALTER COLUMN updated_at TYPE timestamp
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE roulette_bets
          ALTER COLUMN created_at TYPE timestamp
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE roulette_bets
          ALTER COLUMN updated_at TYPE timestamp
          USING updated_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE code_verifications
          ALTER COLUMN created_at TYPE timestamp
          USING created_at::timestamp;
    `);

    await queryRunner.query(`
          ALTER TABLE code_verifications
          ALTER COLUMN updated_at TYPE timestamp
          USING updated_at::timestamp;
    `);
  }
}
