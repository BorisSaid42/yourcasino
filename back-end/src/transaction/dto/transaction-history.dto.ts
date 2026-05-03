import { Expose } from 'class-transformer';
import { UserTransaction } from '../user-transaction.entity';

export class TransactionHistoryDTO {
  @Expose()
  public id: string;

  @Expose()
  public symbol: string;

  @Expose()
  public amount: number;

  @Expose()
  public status: string;

  @Expose()
  public txHash: string;

  @Expose()
  public externalStatus: string;

  @Expose()
  public createdAt: Date;

  constructor(data: UserTransaction) {
    this.id = data.id;
    this.symbol = data.asset;
    this.amount = data.amountUsd;
    this.status = data.status;
    this.txHash = data.transactionHash;
    this.externalStatus = data.externalSubStatus;
    this.createdAt = data.createdAt;
  }
}
