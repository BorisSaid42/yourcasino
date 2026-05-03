import { use, useCallback } from 'react';
import notificationIcon from '../../assets/icons/notification-icon.svg';
import { NotificationsContext } from '../../providers/notifications/context';

interface INotificationsButtonProps {
  showNotificationDropdown: boolean;
  toggleNotificationDropdown: () => void;
  isOpen: boolean;
}

export const NotificationsButton = ({ toggleNotificationDropdown, isOpen }: INotificationsButtonProps) => {
  const { hasNewNotification: hasUnreadNotification, clearNewNotification: clearUnreadNotification } =
    use(NotificationsContext);

  const handleButtonClick = useCallback(() => {
    clearUnreadNotification();
    toggleNotificationDropdown();
  }, [clearUnreadNotification, toggleNotificationDropdown]);

  return (
    <div
      className={`nav-button relative select-none ${
        isOpen ? 'shadow-[inset_0_0_0_2px_#4486DD]' : 'shadow-[inset_0_0_0_2px_transparent]'
      }`}
      onClick={handleButtonClick}
    >
      {hasUnreadNotification && <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-[50%] bg-[#4486DD]" />}
      <img className="px-[17px] py-3" src={notificationIcon} alt="notification icon" />
    </div>
  );
};
