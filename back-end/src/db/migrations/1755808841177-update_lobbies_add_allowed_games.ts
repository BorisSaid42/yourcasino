import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateLobbiesAddAllowedGames1755808841177 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('lobbies', [
      new TableColumn({
        name: 'is_blackjack_enabled',
        type: 'boolean',
        default: 'FALSE',
      }),
      new TableColumn({
        name: 'is_roulette_enabled',
        type: 'boolean',
        default: 'FALSE',
      }),
    ]);

    await queryRunner.query(`
      UPDATE lobbies
      SET is_blackjack_enabled = TRUE
      WHERE bankroll > 0;
    `);

    await queryRunner.query(`
      UPDATE lobbies
      SET is_roulette_enabled = TRUE
      WHERE roulette_bankroll > 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('lobbies', ['is_blackjack_enabled', 'is_roulette_enabled']);
  }
}
