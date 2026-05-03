import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRefundedColumnToUserTransactions1761555243522 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_transactions',
      new TableColumn({
        name: 'refunded',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.query(`
        UPDATE user_transactions ut
        SET refunded = true
        WHERE ut.status = 'failed'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_transactions', 'refunded');
  }
}
