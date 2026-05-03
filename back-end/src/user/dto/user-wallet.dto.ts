import { IsEnum, IsString } from 'class-validator';
import { WalletAsset } from '../user-wallet.entity';

export class UserWalletDTO {
  @IsString()
  public address: string;

  @IsString()
  public userId: string;

  @IsEnum(WalletAsset)
  public asset: WalletAsset;

  @IsString()
  public vaultId: string;

  constructor(body?: Partial<UserWalletDTO>) {
    Object.assign(this, body);
  }
}
