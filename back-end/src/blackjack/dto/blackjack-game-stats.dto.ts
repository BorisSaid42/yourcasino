import { Expose } from 'class-transformer';

export class BlackjackGameStatisticsDTO {
  @Expose()
  public name: Date;

  @Expose()
  public value: number;

  constructor(data: BlackjackGameStatisticsDTO) {
    this.name = data.name;
    this.value = data.value;
  }
}
