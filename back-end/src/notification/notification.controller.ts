import { Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentCredentials } from '../auth/decorators/current-credentials.decorator';
import { LoggedInCredentials } from '../auth/dto/jwt-credentials.dto';
import { NotificationDTO } from './dto/notification.dto';
import { NotificationService } from './notification.service';

@Controller({
  path: '/notification',
  version: '1',
})
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/unread')
  public async getUserNotifications(
    @CurrentCredentials() credentials: LoggedInCredentials,
  ): Promise<NotificationDTO[]> {
    const notifications = await this.notificationService.getUserNotifications(credentials.user);
    return notifications.map((notification) => new NotificationDTO(notification));
  }

  @Post('/read')
  public async markAsRead(@CurrentCredentials() credentials: LoggedInCredentials) {
    return this.notificationService.markAsRead(credentials.user);
  }

  @Post('/read/:notificationId')
  public async markNotificationAsRead(
    @CurrentCredentials() credentials: LoggedInCredentials,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markNotificationAsRead(credentials.user, notificationId);
  }
}
