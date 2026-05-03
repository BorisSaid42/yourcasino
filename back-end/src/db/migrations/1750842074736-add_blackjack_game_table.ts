import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddBlackjackGameTable1750842074736 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blackjack_games',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'is_current',
            type: 'boolean',
            default: 'FALSE',
          },
          {
            name: 'status',
            type: 'varchar',
            default: `'waiting_players'`,
          },
          {
            name: 'bet_deadline',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deck',
            type: 'jsonb',
            default: `'[]'`,
          },
          {
            name: 'dealer_hand',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'lobby_id',
            type: 'varchar',
            length: '36',
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
      'blackjack_games',
      new TableForeignKey({
        columnNames: ['lobby_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lobbies',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blackjack_games');
  }
}
