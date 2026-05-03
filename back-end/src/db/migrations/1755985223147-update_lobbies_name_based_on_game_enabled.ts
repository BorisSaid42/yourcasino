import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateLobbiesNameBasedOnGameEnabled1755985223147 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const lobbies = (await queryRunner.query(`
        SELECT id, is_blackjack_enabled, is_roulette_enabled
        FROM lobbies
      `)) as {
      id: string;
      is_blackjack_enabled: boolean;
      is_roulette_enabled: boolean;
    }[];

    for (const lobby of lobbies) {
      let newName = '';

      if (lobby.is_blackjack_enabled && lobby.is_roulette_enabled) {
        newName = 'Blackjack & Roulette';
      } else if (lobby.is_blackjack_enabled) {
        newName = 'Blackjack';
      } else if (lobby.is_roulette_enabled) {
        newName = 'Roulette';
      }

      await queryRunner.query(`UPDATE lobbies SET name = $1 WHERE id = $2`, [newName, lobby.id]);
    }
  }

  public async down(): Promise<void> {
    //do nothing
  }
}
