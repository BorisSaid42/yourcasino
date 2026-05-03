import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddUserBalanceLogsTable1761131032434 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_balance_logs',
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
            name: 'type',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'amount',
            type: 'float',
          },
          {
            name: 'balance_before',
            type: 'float',
          },
          {
            name: 'balance_after',
            type: 'float',
          },
          {
            name: 'lobby_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'game_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'game_type',
            type: 'varchar',
            length: '24',
            isNullable: true,
          },
          {
            name: 'player_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'related_transaction_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'user_balance_logs',
      new TableForeignKey({
        name: 'FK_user_balance_logs-user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_balance_logs',
      new TableForeignKey({
        name: 'FK_user_balance_logs-lobby',
        columnNames: ['lobby_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lobbies',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.query(`CREATE INDEX "IDX_user_balance_logs_user_id" ON "user_balance_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_balance_logs_lobby_id" ON "user_balance_logs" ("lobby_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_balance_logs_type" ON "user_balance_logs" ("type")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_balance_logs_created_at" ON "user_balance_logs" ("created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_balance_logs');
  }
}
