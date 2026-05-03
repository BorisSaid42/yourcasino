import { CanActivate, HttpException, Injectable } from '@nestjs/common';
import { MaintenanceType } from '../maintenance.entity';
import { MaintenanceService } from '../maintenance.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  async canActivate(): Promise<boolean> {
    if (await this.maintenanceService.isInMaintenance(MaintenanceType.FULL)) {
      throw new HttpException('Maintenance in progress', 418);
    }

    return true;
  }
}
