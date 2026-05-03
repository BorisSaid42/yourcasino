import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Maintenance, MaintenanceType } from './maintenance.entity';
import { MaintenanceStatusDTO } from './dto/maintenance-info.dto';

@Injectable()
export class MaintenanceService {
  constructor(@InjectRepository(Maintenance) private readonly maintenanceRepository: Repository<Maintenance>) {}

  public async isInMaintenance(type?: MaintenanceType | MaintenanceType[]): Promise<boolean> {
    const count =
      !type || typeof type === 'string'
        ? await this.maintenanceRepository.count({ where: { type } })
        : await this.maintenanceRepository.count({ where: { type: In(type) } });

    return count > 0;
  }

  public async findMaintenanceStatus(): Promise<MaintenanceStatusDTO> {
    const isInMaintenance = await this.isInMaintenance(MaintenanceType.FULL);
    const isPaused = await this.isInMaintenance(MaintenanceType.PAUSE);
    const isBlackjackPaused = await this.isInMaintenance(MaintenanceType.PAUSE_BLACKJACK);
    const isRoulettePaused = await this.isInMaintenance(MaintenanceType.PAUSE_ROULETTE);

    return new MaintenanceStatusDTO(isInMaintenance, isPaused, isBlackjackPaused, isRoulettePaused);
  }
}
