import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackGameTable1751544187247 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_games',
      new TableColumn({
        name: 'current_player_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_games', 'current_player_id');
  }
}
