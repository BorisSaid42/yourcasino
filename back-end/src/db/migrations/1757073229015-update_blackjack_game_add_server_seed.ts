import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackGameAddServerSeed1757073229015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('blackjack_games', [
      new TableColumn({
        name: 'server_seed',
        type: 'varchar',
        length: '64',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fairness_random',
        type: 'varchar',
        length: '128',
        isNullable: true,
      }),
      new TableColumn({
        name: 'full_deck',
        type: 'jsonb',
        default: `'[]'`,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('blackjack_games', ['server_seed', 'fairness_random', 'full_deck']);
  }
}
