import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBetsAddProfitColumn1756300641429 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('blackjack_bets', [
      new TableColumn({
        name: 'profit_amount',
        type: 'float',
        default: '0',
      }),
    ]);

    await queryRunner.query('UPDATE blackjack_bets SET profit_amount = won_amount - amount;');

    await queryRunner.addColumns('roulette_bets', [
      new TableColumn({
        name: 'profit_amount',
        type: 'float',
        default: '0',
      }),
    ]);

    await queryRunner.query('UPDATE roulette_bets SET profit_amount = won_amount - amount;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('blackjack_bets', ['profit_amount']);
    await queryRunner.dropColumns('roulette_bets', ['profit_amount']);
  }
}
