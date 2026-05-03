import { Expose } from 'class-transformer';
import { RouletteBetHistoryDTO } from './roulette-bet-history.dto';

export class RouletteBetHistoryPaginatedDTO {
  @Expose()
  public data: RouletteBetHistoryDTO[];

  @Expose()
  public page: number;

  @Expose()
  public totalPages: number;

  @Expose()
  public total: number;

  constructor(data: RouletteBetHistoryPaginatedDTO) {
    this.data = data.data;
    this.page = data.page;
    this.totalPages = data.totalPages;
    this.total = data.total;
  }
}
