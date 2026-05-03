import { use, useEffect, useState } from 'react';
import { ModalContext, ModalProps } from '../../providers/modal/context';

export const MaxWinNoticeModal = ({ lobbyId, userId, gameId }: ModalProps<'max-win-notice'>) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { closeModal } = use(ModalContext);

  useEffect(() => {
    const alreadySet = localStorage.getItem(`dont-show-notice-${lobbyId}-${userId}`);
    if (alreadySet === 'true') {
      closeModal(true);
    }

    const confirmed = localStorage.getItem(`dont-show-notice-${gameId}-${userId}`);
    if (confirmed === 'true') {
      closeModal(true);
    }
  }, [lobbyId, userId, closeModal, gameId]);

  const handleCloseModal = () => {
    if (dontShowAgain) {
      localStorage.setItem(`dont-show-notice-${lobbyId}-${userId}`, 'true');
    }

    if (!dontShowAgain && gameId) {
      localStorage.setItem(`dont-show-notice-${gameId}-${userId}`, 'true');
    }

    closeModal(true);
  };

  return (
    <div className="flex min-h-[260px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-center border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className={`'text-white`}>Important Notice</span>
        </div>
      </div>
      <div className="w-full py-6 text-lg font-bold">
        <div className="flex w-full flex-col items-center justify-center gap-5">
          <div className="text-base text-[#6E88AF]">You can not win an amount exceeding the bankroll</div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 px-9 pt-6 max-md:px-3.5">
          <input
            id="dont-show-again"
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="cursor-pointer"
          />
          <label htmlFor="dont-show-again" className="cursor-pointer text-sm text-[#6E88AF]">
            Don't show again
          </label>
        </div>

        <div className="flex w-full items-center justify-center">
          <div
            onClick={handleCloseModal}
            className="btn-common btn-secondary hover-base absolute bottom-[28px] left-1/2 -translate-x-1/2 max-sm:py-3 max-sm:text-center"
          >
            I Understand
          </div>
        </div>
      </div>
    </div>
  );
};
