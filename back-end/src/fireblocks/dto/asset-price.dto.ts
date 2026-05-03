import { Expose } from 'class-transformer';

export class AssetPriceDTO {
  @Expose()
  public asset: string;

  @Expose()
  public price: number;

  constructor(asset: string, price: number) {
    this.asset = asset;
    this.price = price;
  }
}
