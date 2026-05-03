import { Controller, Get } from '@nestjs/common';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceStatusDTO } from './dto/maintenance-info.dto';

@Controller({
  path: '/maintenance',
  version: '1',
})
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @IsPublic()
  @Get('/status')
  public async getMaintenanceStatus(): Promise<MaintenanceStatusDTO> {
    return this.maintenanceService.findMaintenanceStatus();
  }
}
