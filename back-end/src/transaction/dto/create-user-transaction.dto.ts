import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from '../user-transaction.entity';

export class CreateUserTransactionDTO {
  @IsNumber()
  public amount: number;

  @IsNumber()
  public amountUsd: number;

  @IsNumber()
  public fee: number;

  @IsNumber()
  public networkFee?: number;

  @IsString()
  public type: 'deposit' | 'withdraw';

  @IsString()
  public asset: string;

  @IsOptional()
  @IsString()
  public transactionId?: string;

  @IsOptional()
  @IsString()
  public transactionHash?: string;

  @IsEnum(TransactionStatus)
  public status: TransactionStatus;

  @IsOptional()
  @IsString()
  public senderAddress?: string;

  @IsString()
  public destinationAddress: string;

  @IsOptional()
  @IsString()
  public externalStatus?: string;

  @IsOptional()
  @IsString()
  public externalSubStatus?: string;

  @IsString()
  public userId: string;
}
