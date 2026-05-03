import { IsEnum, IsNumber, IsPositive, IsString, Max } from 'class-validator';
import { WalletAsset } from '../../user/user-wallet.entity';

export class FeeEstimationDTO {
  @IsString()
  public walletAddress: string;

  @IsEnum(WalletAsset, { message: 'Invalid asset type' })
  public asset: WalletAsset;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  @Max(100000)
  public withdrawAmount: number;
}
