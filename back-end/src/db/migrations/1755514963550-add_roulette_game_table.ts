import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddRouletteGameTable1755514963550 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'roulette_games',
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
            default: `'waiting_bets'`,
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
      'roulette_games',
      new TableForeignKey({
        name: 'FK_roulette_games-lobby',
        columnNames: ['lobby_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lobbies',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('roulette_games');
  }
}
