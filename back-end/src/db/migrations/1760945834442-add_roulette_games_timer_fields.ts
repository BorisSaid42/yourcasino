import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRouletteGamesTimerFields1760945834442 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'roulette_games',
      new TableColumn({
        name: 'timer_deadline',
        type: 'timestamptz',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'roulette_games',
      new TableColumn({
        name: 'timer_type',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('roulette_games', 'timer_type');
    await queryRunner.dropColumn('roulette_games', 'timer_deadline');
  }
}
