import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateLobbiesAddProfitAndBetAmountColumn1756302535769 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('lobbies', [
      new TableColumn({
        name: 'blackjack_wagered',
        type: 'float',
        default: '0',
      }),
      new TableColumn({
        name: 'blackjack_profit_amount',
        type: 'float',
        default: '0',
      }),
      new TableColumn({
        name: 'roulette_wagered',
        type: 'float',
        default: '0',
      }),
      new TableColumn({
        name: 'roulette_profit_amount',
        type: 'float',
        default: '0',
      }),
    ]);

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
    await queryRunner.dropColumns('lobbies', [
      'blackjack_wagered',
      'blackjack_profit_amount',
      'roulette_wagered',
      'roulette_profit_amount',
    ]);
  }
}
