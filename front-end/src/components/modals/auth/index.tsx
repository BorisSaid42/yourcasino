import { useContext, useState } from 'react';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import { ModalContext, ModalProps } from '../../../providers/modal/context';
import { AuthModalOpened } from './auth-modal.enum';
import { LoginModalContent } from './login';
import { RegisterModalContent } from './register';
import { AuthTabButton } from './auth-tab';

export const AuthModal = ({ tab }: ModalProps<'auth'>) => {
  const [authModalOpened, setAuthModalOpened] = useState<AuthModalOpened>(tab ?? AuthModalOpened.LOGIN);
  const { closeModal } = useContext(ModalContext);

  const handleSwitchTab = (tab: AuthModalOpened) => {
    setAuthModalOpened(tab);
  };

  return (
    <div className="w-[508px] rounded-[12px] bg-[#152947] pb-8 max-sm:w-[100vw] max-sm:rounded-none max-sm:pb-6">
      <div className="flex items-center justify-between border-b border-[#12223B] px-9 pt-6 text-2xl font-extrabold">
        <div className="flex gap-6">
          <AuthTabButton
            label="Sign In"
            isActive={authModalOpened === AuthModalOpened.LOGIN}
            onClick={() => handleSwitchTab(AuthModalOpened.LOGIN)}
          />
          <AuthTabButton
            label="Register"
            isActive={authModalOpened === AuthModalOpened.REGISTER}
            onClick={() => handleSwitchTab(AuthModalOpened.REGISTER)}
          />
        </div>
        <button
          onClick={() => closeModal()}
          className="absolute top-5 right-5 cursor-pointer rounded-[5px] bg-[#182E51] p-3.5"
        >
          <img src={crossIcon} />
        </button>
      </div>
      {authModalOpened === AuthModalOpened.LOGIN ? <LoginModalContent /> : <RegisterModalContent />}
    </div>
  );
};
