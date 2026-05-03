import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackBetAddInsuranceColumn1752837300960 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_bets',
      new TableColumn({
        name: 'insurance',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_bets', 'insurance');
  }
}
