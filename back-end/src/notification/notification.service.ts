import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocketDispatcher } from '../socket/dispatcher/dispatcher';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private readonly notificationRepository: Repository<Notification>,
    private readonly dispatcher: SocketDispatcher,
  ) {}

  public async createNotification(userId: string, title: string, message: string, type: string, link?: string | null) {
    const notification = this.notificationRepository.create({
      title,
      message,
      user: { id: userId },
      type,
      link,
    });
    await this.notificationRepository.save(notification);
    // You may want to fetch the notification with userId populated if needed
    if (title.includes('Deposit') || title.includes('Withdraw')) {
      this.dispatcher.emitNewCryptoNotification(notification, userId);
      return;
    }
    this.dispatcher.emitNewNotification(notification, userId);
  }

  public async createNotifications(
    payload: { userId: string; title: string; message: string; type: string; link: string | null }[],
  ) {
    const notifications = await this.notificationRepository.save(
      payload.map((p) => ({
        title: p.title,
        message: p.message,
        user: { id: p.userId },
        type: p.type,
        link: p.link,
      })),
    );

    notifications.forEach((notification) => {
      this.dispatcher.emitNewNotification(notification, notification.userId);
    });
  }

  public async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user: { id: userId }, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  public async markAsRead(userId: string) {
    return this.notificationRepository.update(
      {
        user: { id: userId },
      },
      { isRead: true },
    );
  }
  public async markNotificationAsRead(userId: string, notificationId: string) {
    return this.notificationRepository.update(
      {
        user: { id: userId },
        id: notificationId,
      },
      { isRead: true },
    );
  }
}
