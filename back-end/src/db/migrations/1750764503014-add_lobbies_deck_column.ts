import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLobbiesDeckColumn1750764503014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'lobbies',
      new TableColumn({
        name: 'deck',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lobbies', 'deck');
  }
}
