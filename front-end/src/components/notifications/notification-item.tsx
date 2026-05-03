import { Notification, NotificationTypeEnum } from '../../providers/notifications/context';
import dollarIconLarge from '../../assets/icons/common/dollar-icon-large.svg';
import crossIcon from '../../assets/icons/common/cross-icon.svg';
import linkIcon from '../../assets/icons/common/link-icon-alt.svg';
import createLobbyIcon from '../../assets/icons/btn-icon-add.svg';
import { useCallback } from 'react';
import dollarIconGreen from '../../assets/icons/common/dollar-icon-green.svg';
import dollarIconOrange from '../../assets/icons/common/dollar-icon-orange.svg';
import { classNames } from '../../lib/utils';

export const NotificationItem = ({
  notification,
  handleRemoveNotification,
}: {
  notification: Notification;
  handleRemoveNotification: (id: string) => void;
}) => {
  const calculateNotificationIcon = useCallback(() => {
    if (notification.type === NotificationTypeEnum.SUCCESS_TWO) return createLobbyIcon;

    if (notification.type === NotificationTypeEnum.SUCCESS_ONE) return dollarIconGreen;

    if (notification.type === NotificationTypeEnum.WARNING) return dollarIconOrange;

    return dollarIconLarge;
  }, [notification.type]);

  return (
    <div
      className={classNames('flex items-center gap-2.5 rounded-[5px] border border-[#4486DD] bg-[#253C60] px-4 py-3', {
        'notification-success': notification.type === NotificationTypeEnum.SUCCESS_ONE,
        'notification-warning': notification.type === NotificationTypeEnum.WARNING,
        'notification-success-alt': notification.type === NotificationTypeEnum.SUCCESS_TWO,
      })}
    >
      <div className="flex w-6 items-center justify-center">
        <img className="min-w-[14px]" src={calculateNotificationIcon()} />
      </div>
      <div className="flex flex-col">
        <div
          className={classNames('text-xs font-extrabold text-[#4486DD]', {
            'notification-title-success': notification.type === NotificationTypeEnum.SUCCESS_ONE,
            'notification-title-warning': notification.type === NotificationTypeEnum.WARNING,
            'notification-title-success-alt': notification.type === NotificationTypeEnum.SUCCESS_TWO,
          })}
        >
          {notification.title}
        </div>
        <div
          className={classNames('text-[10px] font-bold text-[#6E88AF]', {
            'text-white': notification.type !== NotificationTypeEnum.INFO,
          })}
        >
          {notification.message.split('$')[0]}
          <span
            className={notification.type === NotificationTypeEnum.SUCCESS_ONE ? 'text-[#4EC87D]' : 'text-[#FFB677]'}
          >
            {notification.message.split('$')[1] ? `$${notification.message.split('$')[1]}` : ''}
          </span>
        </div>
      </div>
      <div className="ml-auto flex items-center justify-center gap-1">
        {notification?.link && (
          <a
            href={notification.link}
            className="nav-button flex min-h-[24px] w-[30px] items-center justify-center rounded-[5px] bg-[#182E51]"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={linkIcon} alt="link icon" />
          </a>
        )}
        <button
          onClick={() => handleRemoveNotification(notification.id)}
          className="nav-button flex min-h-[24px] w-[30px] cursor-pointer items-center justify-center rounded-[5px] bg-[#182E51]"
        >
          <img src={crossIcon} />
        </button>
      </div>
    </div>
  );
};
