import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBlackjackGamesAddNumOfDecks1764238019167 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_games',
      new TableColumn({
        name: 'num_of_decks',
        type: 'int',
        default: 1,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_games', 'num_of_decks');
  }
}
