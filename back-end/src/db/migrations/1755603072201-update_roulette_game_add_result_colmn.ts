import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateRouletteGameAddResultColmn1755603072201 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'roulette_games',
      new TableColumn({
        name: 'result',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('roulette_games', 'result');
  }
}
