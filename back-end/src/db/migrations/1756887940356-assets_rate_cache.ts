import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AssetsRateCache1756887940356 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'assets_rate_cache',
        columns: [
          {
            name: 'symbol',
            type: 'varchar',
            length: '6',
            isPrimary: true,
          },
          {
            name: 'asset_name',
            type: 'varchar',
            length: '16',
          },
          {
            name: 'rate',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '6',
          },
          {
            name: 'cached_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.query(`
        INSERT INTO assets_rate_cache (symbol, asset_name, rate, currency)
        VALUES
          ('BTC', 'bitcoin', NULL, 'usd'),
          ('ETH', 'ethereum', NULL, 'usd'),
          ('USDT', 'tether', NULL, 'usd'),
          ('LTC', 'litecoin', NULL, 'usd'),
          ('SOL', 'solana', NULL, 'usd')
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('assets_rate_cache');
  }
}
