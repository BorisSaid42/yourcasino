import { CanActivate, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { MaintenanceType } from '../maintenance.entity';
import { MaintenanceService } from '../maintenance.service';

@Injectable()
export class SocketMaintenanceGuard implements CanActivate {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  async canActivate(): Promise<boolean> {
    if (await this.maintenanceService.isInMaintenance(MaintenanceType.FULL)) {
      throw new WsException('Maintenance in progress');
    }

    return true;
  }
}
