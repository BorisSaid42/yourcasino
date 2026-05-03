import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class UpdateBlackjackBetTable1751543054956 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('blackjack_bets');

    if (!table) return;

    const userFk = table.foreignKeys.find((fk) => fk.columnNames.indexOf('user_id') !== -1);
    const gameFk = table.foreignKeys.find((fk) => fk.columnNames.indexOf('game_id') !== -1);

    if (userFk) {
      await queryRunner.dropForeignKey('blackjack_bets', userFk);
    }

    if (gameFk) {
      await queryRunner.dropForeignKey('blackjack_bets', gameFk);
    }

    await queryRunner.dropColumns('blackjack_bets', ['user_id', 'game_id', 'hand']);

    await queryRunner.addColumn(
      'blackjack_bets',
      new TableColumn({
        name: 'player_id',
        type: 'varchar',
        length: '36',
      }),
    );

    await queryRunner.createForeignKey(
      'blackjack_bets',
      new TableForeignKey({
        name: 'FK_blackjack_bets-player',
        columnNames: ['player_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'blackjack_players',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('blackjack_bets', 'FK_blackjack_bets-player');
    await queryRunner.dropColumn('blackjack_bets', 'player_id');

    await queryRunner.addColumns('blackjack_bets', [
      new TableColumn({
        name: 'game_id',
        type: 'varchar',
        length: '36',
      }),
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
      }),
      new TableColumn({
        name: 'hand',
        type: 'jsonb',
        default: `'[]'`,
      }),
    ]);
  }
}
