import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddVerificationsTable1756384491521 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'code_verifications',
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
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'used',
            type: 'boolean',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'expire_at',
            type: 'timestamp',
            isNullable: true,
            default: null,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '36',
            isNullable: false,
            default: `'reset-password'`,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'code_verifications',
      new TableForeignKey({
        name: 'FK_code_verifications_users',
        referencedTableName: 'users',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('code_verifications', 'FK_code_verifications_users');
    await queryRunner.dropTable('code_verifications');
  }
}
