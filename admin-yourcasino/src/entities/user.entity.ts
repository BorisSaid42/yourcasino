import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public googleId: string;

  @Column()
  public email: string;

  @Column()
  public username: string;

  @Column()
  public displayName: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  public password: string | null;

  @Column({ type: 'float', default: 0 })
  public balance: number;

  @Column({ type: 'varchar', nullable: true })
  public avatarUrl: string | null;

  @Column({ type: 'timestamp', nullable: true })
  public emailVerifiedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  public bannedUntil: Date | null;

  @Column({ type: 'timestamp' })
  public resetStatsAt: Date;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
