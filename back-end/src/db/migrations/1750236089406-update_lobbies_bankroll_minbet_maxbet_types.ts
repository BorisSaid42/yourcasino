import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateLobbiesBankrollMinbetMaxbetTypes1750236089406 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE lobbies
            ALTER COLUMN bankroll TYPE double precision USING bankroll::double precision,
            ALTER COLUMN min_bet  TYPE double precision USING min_bet::double precision,
            ALTER COLUMN max_bet  TYPE double precision USING max_bet::double precision;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE lobbies
            ALTER COLUMN bankroll TYPE bigint USING round(bankroll)::bigint,
            ALTER COLUMN min_bet  TYPE bigint USING round(min_bet)::bigint,
            ALTER COLUMN max_bet  TYPE bigint USING round(max_bet)::bigint;
        `);
  }
}
