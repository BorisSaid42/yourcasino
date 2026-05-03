import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddTableSeatsTable1750764126709 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'table_seats',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'lobby_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'is_dealer',
            type: 'boolean',
            default: false,
          },
          {
            name: 'has_stood',
            type: 'boolean',
            default: false,
          },
          {
            name: 'hand',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'total',
            type: 'int',
            default: 0,
          },
          {
            name: 'seat_index',
            type: 'int',
            default: 0,
          },
          {
            name: 'bet_amount',
            type: 'int',
            default: 0,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'table_seats',
      new TableForeignKey({
        columnNames: ['lobby_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lobbies',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'table_seats',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('table_seats');
  }
}
