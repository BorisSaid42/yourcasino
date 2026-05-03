import { Expose } from 'class-transformer';

export class MaintenanceStatusDTO {
  @Expose()
  public isInMaintenance: boolean;

  @Expose()
  public isPaused: boolean;

  @Expose()
  public isBlackjackPaused: boolean;

  @Expose()
  public isRoulettePaused: boolean;

  constructor(isInMaintenance: boolean, isPaused: boolean, isBlackjackPaused: boolean, isRoulettePaused: boolean) {
    this.isInMaintenance = isInMaintenance;
    this.isPaused = isPaused;
    this.isBlackjackPaused = isBlackjackPaused;
    this.isRoulettePaused = isRoulettePaused;
  }
}
