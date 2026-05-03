import { Expose } from 'class-transformer';
import { BetHistoryDTO } from './bet-history.dto';

export class BetHistoryResultDTO {
  @Expose()
  public data: BetHistoryDTO[];

  @Expose()
  public page: number;

  @Expose()
  public totalPages: number;

  @Expose()
  public total: number;

  constructor(data: BetHistoryResultDTO) {
    this.data = data.data;
    this.page = data.page;
    this.totalPages = data.totalPages;
    this.total = data.total;
  }
}
