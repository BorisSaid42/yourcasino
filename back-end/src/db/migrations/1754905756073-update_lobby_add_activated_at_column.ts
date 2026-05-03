import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateLobbyAddActivatedAtColumn1754905756073 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'lobbies',
      new TableColumn({
        name: 'activated_at',
        type: 'timestamp',
        default: 'now()',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lobbies', 'activated_at');
  }
}
