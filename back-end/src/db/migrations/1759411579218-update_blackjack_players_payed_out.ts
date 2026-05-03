import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackPlayersPayedOut1759411579218 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_players',
      new TableColumn({
        name: 'payed_out',
        type: 'boolean',
        default: 'FALSE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_players', 'payed_out');
  }
}
