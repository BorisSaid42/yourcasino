import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateGamesAddProfitAndWagerColumn1756300975342 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('blackjack_games', [
      new TableColumn({
        name: 'wagered',
        type: 'float',
        default: '0',
      }),
      new TableColumn({
        name: 'profit_amount',
        type: 'float',
        default: '0',
      }),
    ]);

    await queryRunner.query(`
      UPDATE blackjack_games g
      SET
        wagered = COALESCE(stats.total_bet, 0),
        profit_amount = COALESCE(-stats.total_profit, 0)
      FROM (
        SELECT p.game_id,
               SUM(b.amount) AS total_bet,
               SUM(b.won_amount - b.amount) AS total_profit
        FROM blackjack_bets b
        JOIN blackjack_players p ON b.player_id = p.id
        GROUP BY p.game_id
      ) AS stats
      WHERE g.id = stats.game_id;
    `);

    await queryRunner.addColumns('roulette_games', [
      new TableColumn({
        name: 'wagered',
        type: 'float',
        default: '0',
      }),
      new TableColumn({
        name: 'profit_amount',
        type: 'float',
        default: '0',
      }),
    ]);

    await queryRunner.query(`
        UPDATE roulette_games g
        SET
          wagered = COALESCE(stats.total_bet, 0),
          profit_amount = COALESCE(-stats.total_profit, 0)
        FROM (
          SELECT b.game_id,
                 SUM(b.amount) AS total_bet,
                 SUM(b.profit_amount) AS total_profit
          FROM roulette_bets b
          GROUP BY b.game_id
        ) AS stats
        WHERE g.id = stats.game_id;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('blackjack_games', ['profit_amount', 'wagered']);
    await queryRunner.dropColumns('roulette_games', ['profit_amount', 'wagered']);
  }
}
