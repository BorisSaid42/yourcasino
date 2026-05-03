import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateUserTransactionsAddFee1760264907845 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_transactions',
      new TableColumn({
        name: 'fee',
        type: 'float',
        default: '0',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_transactions', 'fee');
  }
}
