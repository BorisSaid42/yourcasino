import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum AssetName {
  bitcoin = 'bitcoin',
  ethereum = 'ethereum',
  tether = 'tether',
  litecoin = 'litecoin',
  solana = 'solana',
}

@Entity({ name: 'assets_rate_cache' })
export class AssetRateCache {
  @PrimaryColumn({ type: 'varchar', length: 6 })
  public symbol: string;

  @Column()
  public assetName: AssetName;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  public rate: number;

  @Column()
  public currency: string;

  @UpdateDateColumn()
  public cachedAt: Date;
}
