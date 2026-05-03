import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from './maintenance.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Maintenance])],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
  controllers: [MaintenanceController],
})
export class MaintenanceModule {}
