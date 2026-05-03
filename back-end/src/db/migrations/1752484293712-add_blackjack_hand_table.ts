import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddBlackjackHandTable1752484293712 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blackjack_hands',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'player_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'hand',
            type: 'jsonb',
            default: `'[]'`,
          },
          {
            name: 'hand_total',
            type: 'int',
            default: '0',
          },
          {
            name: 'payout_result',
            type: 'varchar',
            isNullable: true,
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
            name: 'has_doubled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_doubled_revealed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'has_splitted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'hand_index',
            type: 'int',
            default: '0',
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

    await queryRunner.createForeignKey(
      'blackjack_hands',
      new TableForeignKey({
        name: 'FK_blackjack_hands-player',
        columnNames: ['player_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'blackjack_players',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blackjack_hands');
  }
}
