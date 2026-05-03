import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackPlayerTableAddHandTotal1751577056265 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('blackjack_players', [
      new TableColumn({
        name: 'hand_total',
        type: 'int',
        default: '0',
      }),
      new TableColumn({
        name: 'seat_index',
        type: 'int',
        default: '0',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('blackjack_players', ['hand_total', 'seat_index']);
  }
}
