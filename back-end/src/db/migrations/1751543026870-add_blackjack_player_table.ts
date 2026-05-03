import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddBlackjackPlayerTable1751543026870 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blackjack_players',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: 'gen_random_uuid()',
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
      'blackjack_players',
      new TableForeignKey({
        name: 'FK_blackjack_players-game',
        columnNames: ['game_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'blackjack_games',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'blackjack_players',
      new TableForeignKey({
        name: 'FK_blackjack_players-user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blackjack_players');
  }
}
