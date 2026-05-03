import { Expose } from 'class-transformer';
import { Notification } from '../notification.entity';

export class NotificationDTO {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  message: string;

  @Expose()
  type: string | null; // e.g., 'info', 'warning', 'error', 'success_one', 'success_two'

  @Expose()
  link: string | null; // URL to redirect when notification is clicked

  @Expose()
  createdAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.title = notification.title;
    this.message = notification.message;
    this.type = notification.type;
    this.link = notification.link;
    this.createdAt = notification.createdAt;
  }
}
