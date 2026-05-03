import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializeUserBalanceLogs1761131046395 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO user_balance_logs (
        id,
        user_id,
        type,
        amount,
        balance_before,
        balance_after,
        lobby_id,
        game_id,
        game_type,
        player_id,
        reason,
        related_transaction_id,
        created_at
      )
      SELECT
        gen_random_uuid() as id,
        u.id as user_id,
        'admin_adjustment' as type,
        u.balance as amount,
        0 as balance_before,
        u.balance as balance_after,
        NULL as lobby_id,
        NULL as game_id,
        NULL as game_type,
        NULL as player_id,
        CASE
          WHEN u.balance > 0 THEN 'Initial balance snapshot'
          ELSE 'Initial balance snapshot - zero balance'
        END as reason,
        NULL as related_transaction_id,
        u.created_at as created_at
      FROM users u
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM user_balance_logs
      WHERE reason LIKE 'Initial balance snapshot%'
    `);
  }
}
