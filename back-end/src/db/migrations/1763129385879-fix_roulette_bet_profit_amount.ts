import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRouletteBetProfitAmount1763129385879 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE roulette_bets
      SET profit_amount = won_amount - amount;
    `);

    await queryRunner.query(`
      UPDATE roulette_games g
      SET profit_amount = COALESCE(-stats.total_profit, 0)
      FROM (
        SELECT b.game_id,
               SUM(b.profit_amount) AS total_profit
        FROM roulette_bets b
        GROUP BY b.game_id
      ) AS stats
      WHERE g.id = stats.game_id;
    `);

    await queryRunner.query(`
      UPDATE lobbies l
      SET roulette_profit_amount = COALESCE(stats.total_profit, 0)
      FROM (
        SELECT game.lobby_id,
               SUM(game.profit_amount) AS total_profit
        FROM roulette_games game
        GROUP BY game.lobby_id
      ) AS stats
      WHERE l.id = stats.lobby_id;
    `);
  }

  public async down(): Promise<void> {
    // do nothing
  }
}
