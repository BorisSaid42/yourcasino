import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdatePlayerAddPayoutResultColumn1751871814109 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_players',
      new TableColumn({
        name: 'payout_result',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_players', 'payout_result');
  }
}
