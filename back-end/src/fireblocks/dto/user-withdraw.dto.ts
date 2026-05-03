import { IsEnum, IsNumber, IsPositive, IsString, Max, Min } from 'class-validator';
import { WalletAsset } from '../../user/user-wallet.entity';

export class UserWithdrawDTO {
  @IsString()
  public walletAddress: string;

  @IsEnum(WalletAsset, { message: 'Invalid asset type' })
  public asset: WalletAsset;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  @Max(100000, { message: 'Withdraw amount must be $100000 or below' })
  @Min(10, { message: 'Withdraw amount must be $10 or above' })
  public withdrawAmountUsd: number;
}
