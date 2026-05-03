import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackGamePayedOut1759412812985 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_games',
      new TableColumn({
        name: 'payed_out',
        type: 'boolean',
        default: 'FALSE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_games', 'payed_out');
  }
}
