import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateUsersAddBannedUntilColumn1763638987944 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'banned_until',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'banned_until');
  }
}
