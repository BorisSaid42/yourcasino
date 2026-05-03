import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddUsersTable1749647539697 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '320',
            isUnique: true,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '48',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '256',
            isUnique: true,
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            length: '2048',
            isNullable: true,
          },
          {
            name: 'email_verified_at',
            type: 'timestamp',
            isNullable: true,
            default: 'null',
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
