import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackPlayerAddInsuredColumn1752832523257 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_players',
      new TableColumn({
        name: 'insured',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_players', 'insured');
  }
}
