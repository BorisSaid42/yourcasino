import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddTransactionsTable1753267238938 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_transactions',
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
            name: 'amount',
            type: 'float',
            default: '0',
          },
          {
            name: 'amount_usd',
            type: 'float',
            default: '0',
          },
          {
            name: 'network_fee',
            type: 'float',
            default: '0',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'asset',
            type: 'varchar',
            length: '12',
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'transaction_hash',
            type: 'varchar',
            length: '88',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '24',
          },
          {
            name: 'external_status',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'external_sub_status',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'sender_address',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'destination_address',
            type: 'varchar',
            length: '128',
            isNullable: true,
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
      'user_transactions',
      new TableForeignKey({
        name: 'FK_user_transactions-user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_transactions');
  }
}
