import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum MaintenanceType {
  FULL = 'FULL',
  PAUSE = 'PAUSE',
  PAUSE_BLACKJACK = 'PAUSE_BJ',
  PAUSE_ROULETTE = 'PAUSE_RT',
}

@Entity({ name: 'maintenance' })
export class Maintenance extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ enum: MaintenanceType })
  public type: MaintenanceType;

  @CreateDateColumn()
  public createdAt: Date;
}
