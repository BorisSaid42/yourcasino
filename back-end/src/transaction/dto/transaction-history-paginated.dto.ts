import { Expose } from 'class-transformer';
import { TransactionHistoryDTO } from './transaction-history.dto';

export class TransactionHistoryResultDTO {
  @Expose()
  public data: TransactionHistoryDTO[];

  @Expose()
  public page: number;

  @Expose()
  public totalPages: number;

  @Expose()
  public total: number;

  constructor(data: TransactionHistoryResultDTO) {
    this.data = data.data;
    this.page = data.page;
    this.totalPages = data.totalPages;
    this.total = data.total;
  }
}
