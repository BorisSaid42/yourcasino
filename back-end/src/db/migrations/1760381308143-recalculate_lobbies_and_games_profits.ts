import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecalculateLobbiesAndGamesProfits1760381308143 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(`
        UPDATE lobbies l
        SET
          blackjack_wagered = COALESCE(stats.total_bet, 0),
          blackjack_profit_amount = COALESCE(stats.total_profit, 0)
        FROM (
          SELECT game.lobby_id,
                 SUM(game.wagered) AS total_bet,
                 SUM(game.profit_amount) AS total_profit
          FROM blackjack_games game
          GROUP BY game.lobby_id
        ) AS stats
        WHERE l.id = stats.lobby_id;
      `);

    await queryRunner.query(`
        UPDATE lobbies l
        SET
          roulette_wagered = COALESCE(stats.total_bet, 0),
          roulette_profit_amount = COALESCE(stats.total_profit, 0)
        FROM (
          SELECT game.lobby_id,
                 SUM(game.wagered) AS total_bet,
                 SUM(game.profit_amount) AS total_profit
          FROM roulette_games game
          GROUP BY game.lobby_id
        ) AS stats
        WHERE l.id = stats.lobby_id;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE blackjack_games SET wagered = 0, profit_amount = 0;
    `);
    await queryRunner.query(`
      UPDATE lobbies SET blackjack_wagered = 0, blackjack_profit_amount = 0;
    `);
  }
}
