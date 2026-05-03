import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGamesServerSeed128Length1760092739266 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "blackjack_games"
      ALTER COLUMN "server_seed" TYPE varchar(128);
    `);
    await queryRunner.query(`
      ALTER TABLE "roulette_games"
      ALTER COLUMN "server_seed" TYPE varchar(128);
    `);
  }

  public async down(): Promise<void> {
    // do nothing
  }
}
