import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddLobbyTransactionsTable1760957997092 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the lobby_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'lobby_transactions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'game',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'amount',
            type: 'float',
            default: '0',
          },
          {
            name: 'lobby_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Insert initial transaction records for existing lobbies (blackjack bankroll)
    await queryRunner.query(`
      INSERT INTO lobby_transactions (type, game, amount, lobby_id, created_at)
      SELECT
        'created_lobby' as type,
        'blackjack' as game,
        bankroll * 100 as amount,
        id as lobby_id,
        created_at as created_at
      FROM lobbies
      WHERE bankroll > 0
    `);

    // Insert initial transaction records for existing lobbies (roulette bankroll)
    await queryRunner.query(`
      INSERT INTO lobby_transactions (type, game, amount, lobby_id, created_at)
      SELECT
        'created_lobby' as type,
        'roulette' as game,
        roulette_bankroll * 100 as amount,
        id as lobby_id,
        created_at as created_at
      FROM lobbies
      WHERE roulette_bankroll > 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('lobby_transactions');
  }
}
