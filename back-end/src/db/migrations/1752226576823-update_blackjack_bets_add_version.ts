import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackBetsAddVersion1752226576823 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_bets',
      new TableColumn({
        name: 'version',
        type: 'int',
        default: '0',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_bets', 'blackjack_bets');
  }
}
