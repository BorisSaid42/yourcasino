import { use, useCallback } from 'react';
import { capitalizeFirstLetter } from '../../lib/utils';
import { ModalContext, ModalProps } from '../../providers/modal/context';
import { useCredentials } from '../../queries/auth';
import { LobbyGame, useDeactivateGame, useLobbyData } from '../../queries/lobby';

export const ClosingGameConfirmation = ({
  code,
  game,
  currentValues,
}: ModalProps<'closing-game-confirmation-modal'>) => {
  const { data: credentials } = useCredentials();
  const { data: lobby } = useLobbyData(code);
  const { replaceModal } = use(ModalContext);
  const deactivateGame = useDeactivateGame();

  const handleConfirmDeactivateGame = useCallback(async () => {
    if (!lobby) return;

    if (!currentValues) {
      await deactivateGame.mutateAsync({ lobbyId: lobby?.id, game });
      window.location.reload();
      return;
    }
    return replaceModal(() => ({
      key: 'edit-lobby',
      props: { lobbyId: lobby?.id, game, choice: 'accept', currentValues },
      closable: true,
    }));
  }, [lobby, currentValues, replaceModal, deactivateGame, game]);

  const handleCloseConfirmationModal = useCallback(() => {
    if (!lobby) return;

    if (!currentValues) {
      return replaceModal(() => ({
        key: 'bankroll-insufficient-funds',
        props: { code, game: LobbyGame.BLACKJACK },
        closable: false,
        lightBlur: true,
      }));
    }
    return replaceModal(() => ({
      key: 'edit-lobby',
      props: { lobbyId: lobby?.id, game, choice: 'cancel', currentValues },
      closable: true,
    }));
  }, [code, currentValues, game, lobby, replaceModal]);

  return (
    <div className="flex min-h-[280px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-center border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className="text-[24px] text-white">Close {capitalizeFirstLetter(game)} Game</span>
        </div>
      </div>
      <div className="w-full py-6 text-lg font-extrabold text-[#6E88AF]">
        {credentials?.user === lobby?.ownerId && (
          <div className="flex w-full flex-col items-center justify-center gap-5">
            <div className="flex w-full flex-col items-center justify-center gap-1 border-b border-b-[#12223B] text-center">
              <div className="text-xl font-bold text-white">Are you sure you would like to close this game?</div>
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="font-semibold text-[#6E88AF]">
                  If Bankroll is still in this game, it will be added back to your on-site balance.
                </div>
                <div className="text-sm font-semibold wrap-normal text-[#6E88AF]">
                  A 5% fee will be taken from any current profits.
                </div>
              </div>
            </div>
            <div className="flex w-full items-center justify-center gap-6 px-9 max-md:px-3.5">
              <div
                onClick={handleConfirmDeactivateGame}
                className="btn-common btn-primary hover-base items-center max-sm:justify-center max-sm:!py-3"
              >
                Accept
              </div>
              <div
                onClick={handleCloseConfirmationModal}
                className="btn-common btn-secondary hover-base items-center max-sm:justify-center max-sm:!py-3"
              >
                Cancel
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
