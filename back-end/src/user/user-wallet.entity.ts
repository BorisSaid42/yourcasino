import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum WalletAsset {
  BTC = 'BTC',
  ETH = 'ETH',
  SOL = 'SOL',
  USDT = 'USDT',
  LTC = 'LTC',
}

@Entity({ name: 'user_wallets' })
export class UserWallet {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public address: string;

  @Column({ type: 'enum', enum: WalletAsset })
  public asset: WalletAsset;

  @Column()
  public vaultId: string;

  @RelationId((wallet: UserWallet) => wallet.user)
  public userId: string;

  @ManyToOne(() => User, (user) => user.wallets)
  public user: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
