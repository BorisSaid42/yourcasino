import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveBlackjackPlayersHandColumns1752485428074 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const players: {
      id: string;
      hand: string[];
      hand_total: number;
      has_stood: boolean;
      is_busted: boolean;
    }[] = await queryRunner.query(`
          SELECT id, hand, hand_total, has_stood, is_busted
          FROM blackjack_players
          WHERE jsonb_array_length(hand) > 0
        `);

    for (const player of players) {
      await queryRunner.query(
        `
            INSERT INTO blackjack_hands
              (id, player_id, hand, hand_total, has_stood, is_busted, has_doubled, is_doubled_revealed, has_splitted, created_at, updated_at)
            VALUES
              (gen_random_uuid(), $1, $2, $3, $4, $5, false, false, false, now(), now())
          `,
        [player.id, JSON.stringify(player.hand), player.hand_total, player.has_stood, player.is_busted],
      );
    }

    await queryRunner.dropColumns('blackjack_players', [
      'hand',
      'hand_total',
      'has_stood',
      'is_busted',
      'payout_result',
    ]);

    await queryRunner.addColumn(
      'blackjack_players',
      new TableColumn({
        name: 'current_hand_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blackjack_players', 'current_hand_id');
    await queryRunner.addColumns('blackjack_players', [
      new TableColumn({
        name: 'hand',
        type: 'jsonb',
        default: `'[]'`,
      }),
      new TableColumn({
        name: 'hand_total',
        type: 'int',
        default: '0',
      }),
      new TableColumn({
        name: 'has_stood',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'is_busted',
        type: 'boolean',
        default: false,
      }),
    ]);

    await queryRunner.query(`
        UPDATE blackjack_players p
        SET hand = h.hand,
            hand_total = h.hand_total,
            has_stood = h.has_stood,
            is_busted = h.is_busted
        FROM (
          SELECT DISTINCT ON (player_id) *
          FROM blackjack_hands
          ORDER BY player_id, created_at ASC
        ) AS h
        WHERE p.id = h.player_id
      `);
  }
}
