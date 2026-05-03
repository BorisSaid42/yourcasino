import Intercom from '@intercom/messenger-js-sdk';
import { useEffect, useRef } from 'react';
import { useUser } from '../../providers/user/context';

let globalIntercomInitialized = false;

export const IntercomProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!globalIntercomInitialized && !isInitialized.current && import.meta.env.VITE_INTERCOM_APP_ID) {
      const config: { app_id: string; api_base?: string } = {
        app_id: import.meta.env.VITE_INTERCOM_APP_ID,
      };

      if (import.meta.env.VITE_INTERCOM_API_BASE) {
        config.api_base = import.meta.env.VITE_INTERCOM_API_BASE;
      }

      try {
        Intercom(config);
        isInitialized.current = true;
        globalIntercomInitialized = true;
        console.log('[Intercom] Successfully initialized');
      } catch (error) {
        console.error('[Intercom] Initialization failed:', error);
      }
    } else if (globalIntercomInitialized) {
      isInitialized.current = true;
    }

    return () => {};
  }, []);

  useEffect(() => {
    if (!isInitialized.current || !window.Intercom) return;

    const timeoutId = setTimeout(() => {
      if (!window.Intercom) return;

      try {
        if (user) {
          const updatePayload: Record<string, string | number | undefined> = {
            user_id: user.id,
            name: user.username,
            email: user.email || undefined,
            created_at: user.createdAt ? Math.floor(new Date(user.createdAt).getTime() / 1000) : undefined,
          };

          if (user.intercomHash) {
            updatePayload.user_hash = user.intercomHash;
          }

          window.Intercom('update', updatePayload);
        } else {
          window.Intercom('update');
        }
      } catch (error) {
        console.error('[Intercom] Update failed:', error);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user]);

  return <>{children}</>;
};
