import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddUserWalletsTable1753263844610 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_wallets',
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
            name: 'address',
            type: 'varchar',
            length: '128',
          },
          {
            name: 'asset',
            type: 'varchar',
            length: '8',
          },
          {
            name: 'vault_id',
            type: 'varchar',
            length: '128',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'user_wallets',
      new TableForeignKey({
        name: 'FK_user_wallets-user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_wallets');
  }
}
