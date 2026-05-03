import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateUsersAddGoogleAuth1756652924820 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'google_id',
        type: 'varchar',
        isNullable: true,
        isUnique: true,
      }),
      new TableColumn({
        name: 'display_name',
        type: 'varchar',
        isNullable: true,
      }),
    ]);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "password" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "password" SET NOT NULL
    `);

    await queryRunner.dropColumns('users', ['google_id', 'display_name']);
  }
}
