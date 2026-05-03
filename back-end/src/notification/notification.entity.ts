import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @RelationId((notification: Notification) => notification.user)
  public userId: string;

  @ManyToOne(() => User, (user) => user.notifications)
  public user: User;

  @Column()
  public title: string;

  @Column()
  public message: string;

  @Column({ default: false })
  public isRead: boolean;

  @Column({ type: 'varchar', nullable: false })
  public type: string; // e.g., 'info', 'warning', 'error'

  @Column({ type: 'varchar', nullable: true })
  public link: string | null; // URL to redirect when notification is clicked

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
