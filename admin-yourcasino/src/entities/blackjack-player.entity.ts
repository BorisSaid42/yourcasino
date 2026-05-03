import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity.js';

@Entity({ name: 'blackjack_players' })
export class BlackjackPlayer extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', nullable: true })
  public gameId: string;

  @Column({ type: 'varchar', nullable: true })
  public userId: string;

  @ManyToOne(() => User)
  public user: User;

  @Column({ type: 'int', default: 0 })
  public seatIndex: number;

  @Column()
  public currentHandId: string;

  @Column({ default: false })
  public insured: boolean;

  @Column({ default: false })
  public payedOut: boolean;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
