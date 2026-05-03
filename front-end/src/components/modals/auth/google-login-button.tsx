import { useGoogleLogin as useGoogleLoginHook } from '@react-oauth/google';
import googleIcon from '../../../assets/icons/common/google-color-icon.svg';
import { useGoogleLogin } from '../../../queries/auth';
import { GenericButton } from '../../common/buttons';
import { use, useCallback } from 'react';
import { SocketLockContext } from '../../../providers/socket-locks/context';

interface GoogleLoginProps {
  closeModal: (close: boolean) => void;
}

export const GoogleLoginButton = ({ closeModal }: GoogleLoginProps) => {
  const googleLoginMutation = useGoogleLogin();
  const { isLocked, setLock } = use(SocketLockContext);

  const googleLogin = useGoogleLoginHook({
    flow: 'auth-code',
    onSuccess: async (response) => {
      if ('code' in response) {
        await googleLoginMutation.mutateAsync({ code: response.code });
        setLock('google-login', false);
        closeModal(true);
      }
    },
    onError: () => {
      setLock('google-login', false);
    },
    onNonOAuthError: () => {
      setLock('google-login', false);
    },
  });

  const handleGoogleLogin = useCallback(() => {
    setLock('google-login', true);
    googleLogin();
  }, [googleLogin, setLock]);

  return (
    <div className="flex w-full px-9 py-6">
      <GenericButton
        skin="secondaryDark"
        onClick={handleGoogleLogin}
        text="Sign in with Google"
        leftIcon={<img width={20} className="max-lg:ml-4" src={googleIcon} alt="banner sign" />}
        className="gap-[13px] max-sm:py-3! max-sm:text-xs!"
        isFullWidth={true}
        isProcessing={isLocked('google-login')}
      />
    </div>
  );
};
