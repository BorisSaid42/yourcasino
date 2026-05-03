import { BaseEntity, Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum AssetName {
  bitcoin = 'bitcoin',
  ethereum = 'ethereum',
  tether = 'tether',
  litecoin = 'litecoin',
  solana = 'solana',
}

@Entity({ name: 'assets_rate_cache' })
export class AssetRateCache extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 6 })
  public symbol: string;

  @Column()
  public assetName: AssetName;

  @Column()
  public rate: number;

  @Column()
  public currency: string;

  @UpdateDateColumn()
  public cachedAt: Date;
}
