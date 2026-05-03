import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackGamesRemoveFullDeck1757331676060 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('blackjack_games', ['full_deck']);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('blackjack_games', [
      new TableColumn({
        name: 'full_deck',
        type: 'jsonb',
        default: `'[]'`,
      }),
    ]);
  }
}
