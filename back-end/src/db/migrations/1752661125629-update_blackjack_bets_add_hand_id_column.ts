import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class UpdateBlackjackBetsAddHandIdColumn1752661125629 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blackjack_bets',
      new TableColumn({
        name: 'hand_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'blackjack_bets',
      new TableForeignKey({
        name: 'FK_blackjack_bets-hand',
        columnNames: ['hand_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'blackjack_hands',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('blackjack_bets', 'FK_blackjack_bets-hand');
    await queryRunner.dropColumn('blackjack_bets', 'hand_id');
  }
}
