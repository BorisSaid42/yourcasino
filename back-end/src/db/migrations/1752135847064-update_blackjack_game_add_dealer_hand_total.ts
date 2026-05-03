import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackGameAddDealerHandTotal1752135847064 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_games',
      new TableColumn({
        name: 'dealer_hand_total',
        type: 'int',
        default: '0',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_games', 'dealer_hand_total');
  }
}
