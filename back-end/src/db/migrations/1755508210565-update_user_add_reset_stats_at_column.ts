import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateUserAddResetStatsAtColumn1755508210565 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'reset_stats_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'reset_stats_at');
  }
}
