import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBjBetRemovePayoutResultAddWinAmount1751871845040 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_bets', 'payout_result');

    await queryRunner.addColumn(
      'blackjack_bets',
      new TableColumn({
        name: 'won_amount',
        type: 'float',
        default: '0',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_bets', 'won_amount');

    await queryRunner.addColumn(
      'blackjack_bets',
      new TableColumn({
        name: 'payout_result',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
