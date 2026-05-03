import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddLobbiesTable1749648212590 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lobbies',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '32',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '48',
          },
          {
            name: 'bankroll',
            type: 'bigint',
          },
          {
            name: 'min_bet',
            type: 'bigint',
          },
          {
            name: 'max_bet',
            type: 'bigint',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'is_private',
            type: 'boolean',
            default: 'FALSE',
          },
          {
            name: 'side_bets',
            type: 'boolean',
            default: 'TRUE',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'lobbies',
      new TableForeignKey({
        name: 'FK_lobbies-user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('lobbies');
  }
}
