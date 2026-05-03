import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import * as crypto from 'crypto';

export class UpdateBlackjackGamesAddFullDeck1761157474151 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the full_deck column
    await queryRunner.addColumns('blackjack_games', [
      new TableColumn({
        name: 'full_deck',
        type: 'jsonb',
        default: `'[]'`,
      }),
    ]);

    // Fetch all games that have both server_seed and fairness_random
    const games = (await queryRunner.query(`
      SELECT id, server_seed, fairness_random
      FROM blackjack_games
      WHERE server_seed IS NOT NULL AND fairness_random IS NOT NULL
    `)) as Array<{ id: string; server_seed: string; fairness_random: string }>;

    // Update each game with the generated deck
    for (const game of games) {
      const fullDeck = this.generateShuffledDeck(game.server_seed, game.fairness_random);

      await queryRunner.query(`UPDATE blackjack_games SET full_deck = $1 WHERE id = $2`, [
        JSON.stringify(fullDeck),
        game.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('blackjack_games', ['full_deck']);
  }

  private generateShuffledDeck(serverSeed: string, randomOrgString: string): string[] {
    const suits = ['H', 'D', 'C', 'S'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: string[] = [];

    for (const suit of suits) {
      for (const value of values) {
        deck.push(`${value}${suit}`);
      }
    }

    const baseHash = crypto.createHash('sha256').update(`${serverSeed}:${randomOrgString}`).digest('hex');

    for (let i = deck.length - 1; i > 0; i--) {
      const positionHash = crypto.createHash('sha256').update(`${baseHash}:${i}`).digest('hex');
      const randomValue = parseInt(positionHash.substring(0, 8), 16);
      const j = randomValue % (i + 1);

      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }
}
