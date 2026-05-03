import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddRouletteBetTable1755520759704 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'roulette_bets',
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
            name: 'bet_place',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'amount',
            type: 'float',
          },
          {
            name: 'won_amount',
            type: 'float',
            default: '0',
          },
          {
            name: 'version',
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
      'roulette_bets',
      new TableForeignKey({
        name: 'FK_roulette_bets-game',
        columnNames: ['game_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roulette_games',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'roulette_bets',
      new TableForeignKey({
        name: 'FK_roulette_bets-user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('roulette_bets');
  }
}
