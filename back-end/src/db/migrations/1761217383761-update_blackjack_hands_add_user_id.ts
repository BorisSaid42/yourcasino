import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class UpdateBlackjackHandsAddUserId1761217383761 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_hands',
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
        UPDATE blackjack_hands bh
        SET user_id = bp.user_id
        FROM blackjack_players bp
        WHERE bh.player_id = bp.id
    `);

    await queryRunner.changeColumn(
      'blackjack_hands',
      'user_id',
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: false,
      }),
    );

    await queryRunner.createForeignKey(
      'blackjack_hands',
      new TableForeignKey({
        name: 'FK_blackjack_hands-user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'blackjack_hands',
      new TableIndex({
        name: 'IDX_blackjack_hands_user_id',
        columnNames: ['user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('blackjack_hands', 'IDX_blackjack_hands_user_id');

    await queryRunner.dropForeignKey('blackjack_hands', 'FK_blackjack_hands-user');

    await queryRunner.dropColumn('blackjack_hands', 'user_id');
  }
}
