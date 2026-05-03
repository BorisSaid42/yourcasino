import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateLobbyAddServerSeed1756983173210 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('roulette_games', [
      new TableColumn({
        name: 'server_seed',
        type: 'varchar',
        length: '64',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fairness_random',
        type: 'varchar',
        length: '128',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('roulette_games', ['server_seed', 'fairness_random']);
  }
}
