import { use, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCredentials } from '../../queries/auth';
import { ModalContext } from '../../providers/modal/context';
import { AuthModalOpened } from '../modals/auth/auth-modal.enum';

export function useAuthOnlyRoute() {
  const { data: credentials } = useCredentials();
  const { openModal } = use(ModalContext);
  const navigate = useNavigate();

  return useEffect(() => {
    if (!credentials?.user) {
      openModal({
        key: 'auth',
        props: { tab: AuthModalOpened.LOGIN },
        closable: true,
        onClose: () => navigate({ to: '/' }),
      });
    }
  }, [credentials, navigate, openModal]);
}
