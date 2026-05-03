import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class UpdateBlackjackBetsAddUserId1761218638400 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_bets',
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
        UPDATE blackjack_bets bb
        SET user_id = bp.user_id
        FROM blackjack_players bp
        WHERE bb.player_id = bp.id
    `);

    await queryRunner.changeColumn(
      'blackjack_bets',
      'user_id',
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: false,
      }),
    );

    await queryRunner.createForeignKey(
      'blackjack_bets',
      new TableForeignKey({
        name: 'FK_blackjack_bets-user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'blackjack_bets',
      new TableIndex({
        name: 'IDX_blackjack_bets_user_id',
        columnNames: ['user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('blackjack_bets', 'IDX_blackjack_bets_user_id');

    await queryRunner.dropForeignKey('blackjack_bets', 'FK_blackjack_bets-user');

    await queryRunner.dropColumn('blackjack_bets', 'user_id');
  }
}
