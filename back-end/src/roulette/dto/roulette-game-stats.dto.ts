import { Expose } from 'class-transformer';

export class RouletteGameStatisticsDTO {
  @Expose()
  public name: Date;

  @Expose()
  public value: number;

  constructor(data: RouletteGameStatisticsDTO) {
    this.name = data.name;
    this.value = data.value;
  }
}
