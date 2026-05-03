import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateLobbiesAddBankrollAndBetFields1755517509720 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('lobbies', [
      new TableColumn({
        name: 'roulette_bankroll',
        type: 'float',
        default: '0',
      }),
      new TableColumn({
        name: 'roulette_min_bet',
        type: 'float',
        default: '0',
      }),
      new TableColumn({
        name: 'roulette_max_bet',
        type: 'float',
        default: '0',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('lobbies', ['roulette_bankroll', 'roulette_min_bet', 'roulette_max_bet']);
  }
}
