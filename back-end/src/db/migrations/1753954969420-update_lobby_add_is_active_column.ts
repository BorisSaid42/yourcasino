import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateLobbyAddIsActiveColumn1753954969420 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'lobbies',
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: 'TRUE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lobbies', 'is_active');
  }
}
