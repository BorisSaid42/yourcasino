import { useCallback } from 'react';
import { NotificationItem } from './notification-item';
import emptyListIcon from '../../assets/icons/lobby/empty-list-background.svg';
import { useGetUserNotifications, useMarkAsRead, useMarkNotificationAsRead } from '../../queries/notification';

export const NotificationsDropdown = () => {
  const { data: notifications } = useGetUserNotifications();
  const markAsRead = useMarkAsRead();
  const markNotificationAsRead = useMarkNotificationAsRead();

  const handleClearNotifications = useCallback(() => {
    markAsRead.mutate();
  }, [markAsRead]);

  return (
    <>
      <div className="absolute top-[130%] right-[63px] h-0 w-0 -translate-x-1/2 border-r-[10px] border-b-[12px] border-l-[10px] border-r-transparent border-b-[#253C60] border-l-transparent" />
      <div className="absolute top-[60px] right-0 min-w-[300px] rounded-lg bg-[#253C60] px-5 py-4 select-none">
        {notifications && notifications.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="mb-4 text-xs font-extrabold">Notifications</span>
            <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-[#152947] scrollbar-track-[#6E88AF60] flex max-h-[400px] flex-col gap-2 overflow-y-auto pr-1">
              {notifications.map((notification) => (
                <NotificationItem
                  notification={notification}
                  key={`norification-item-${notification.id}`}
                  handleRemoveNotification={() => markNotificationAsRead.mutate(notification.id)}
                />
              ))}
            </div>
            <button
              onClick={handleClearNotifications}
              className="nav-button mt-4 w-full cursor-pointer rounded-[5px] bg-[#1D3353] p-2.5 text-center text-xs font-bold text-[#6E88AF]"
            >
              Clear Notifications
            </button>
          </div>
        ) : (
          <div className="flex min-h-[148px] flex-col items-center justify-center gap-4">
            <img width={36} src={emptyListIcon} alt="empty list icon" />
            <div className="text-base font-extrabold text-[#465B7C]">No notifications</div>
          </div>
        )}
      </div>
    </>
  );
};
