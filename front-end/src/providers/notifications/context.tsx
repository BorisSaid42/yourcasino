import { createContext } from 'react';

export enum NotificationTypeEnum {
  SUCCESS_ONE = 'success_one',
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS_TWO = 'success_two',
}

export type Notification = {
  id: string;
  message: string;
  title: string;
  type: NotificationTypeEnum;
  link?: string;
  // createdAt: Date;
};

export type NotificationContextType = {
  hasNewNotification: boolean;
  clearNewNotification: () => void;
};

export const NotificationsContext = createContext<NotificationContextType>({
  hasNewNotification: true,
  clearNewNotification: () => void 0,
});
