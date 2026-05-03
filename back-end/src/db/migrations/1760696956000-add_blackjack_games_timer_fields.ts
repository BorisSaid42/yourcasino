import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBlackjackGamesTimerFields1760696956000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_games',
      new TableColumn({
        name: 'timer_deadline',
        type: 'timestamptz',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'blackjack_games',
      new TableColumn({
        name: 'timer_type',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.dropColumn('blackjack_games', 'bet_deadline');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_games', 'timer_type');
    await queryRunner.dropColumn('blackjack_games', 'timer_deadline');

    await queryRunner.addColumn(
      'blackjack_games',
      new TableColumn({
        name: 'bet_deadline',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }
}
