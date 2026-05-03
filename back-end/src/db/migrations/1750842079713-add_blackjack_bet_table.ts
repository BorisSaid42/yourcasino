import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddBlackjackBetTable1750842079713 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blackjack_bets',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'bet_place',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'game_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'amount',
            type: 'float',
          },
          {
            name: 'hand',
            type: 'jsonb',
            default: `'[]'`,
          },
          {
            name: 'has_stood',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_busted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'payout_result',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKeys('blackjack_bets', [
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['game_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'blackjack_games',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blackjack_bets');
  }
}
