import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateInitialExistingLobbyDataForRoulette1755780439848 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE lobbies
            SET roulette_min_bet = 0.5,
                roulette_max_bet = 150,
                roulette_bankroll = 13000
            WHERE owner_id IN (
              SELECT id FROM users WHERE balance > 1000
            );
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE lobbies
        SET roulette_min_bet = NULL,
            roulette_max_bet = NULL,
            roulette_bankroll = NULL
        WHERE owner_id IN (
          SELECT id FROM users WHERE balance > 1000
        );
      `);
  }
}
