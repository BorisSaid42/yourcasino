import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { sockets } from '../../lib/interaction/sockets';
import depositWithdrawSound from '../../assets/depo-withdraw.mp3';
import { NotificationContextType, NotificationsContext, NotificationTypeEnum } from './context';
import { resourceManager } from '../resource-manager';
import { useMedia } from '../media/context';
import { notify } from '../../components/toast';

export type NotificationType = {
  id: string;
  title: string;
  message: string;
  type: NotificationTypeEnum;
  link: string | null;
  createdAt: Date;
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const { isMuted } = useMedia();

  useEffect(() => {
    Promise.all([resourceManager.loadAudio('depo-withdraw', depositWithdrawSound)]).catch((e) => console.error(e));
  }, []);

  const clearNewNotification = useCallback(() => {
    setHasNewNotification(false);
  }, []);

  useEffect(() => {
    const handleNewNotification = () => {
      setHasNewNotification(true);
    };

    const handleNewCryptoNotification = (notification: NotificationType) => {
      resourceManager.playAudio('depo-withdraw', { volume: isMuted ? 0 : 100, clone: true });
      notify(notification.type, { title: notification.title, content: notification.message });
      setHasNewNotification(true);
    };

    sockets.on('notification:new', handleNewNotification);
    sockets.on('crypto:notification:new', handleNewCryptoNotification);

    return () => {
      sockets.off('notifications:new', handleNewNotification);
      sockets.off('crypto:notification:new', handleNewCryptoNotification);
    };
  }, []);

  const value = useMemo<NotificationContextType>(
    () => ({ hasNewNotification, clearNewNotification }),
    [clearNewNotification, hasNewNotification],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};
