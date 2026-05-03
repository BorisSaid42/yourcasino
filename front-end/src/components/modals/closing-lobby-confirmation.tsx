import { Link, useMatch } from '@tanstack/react-router';
import { use, useCallback, useEffect } from 'react';
import { ModalContext, ModalProps } from '../../providers/modal/context';
import { useCredentials } from '../../queries/auth';
import { LobbyGame, LobbyState, useDeactivateLobby, useLobbyData } from '../../queries/lobby';

export const ClosingLobbyConfirmation = ({ code }: ModalProps<'closing-lobby-confirmation-modal'>) => {
  const { data: credentials } = useCredentials();
  const { data: lobby } = useLobbyData(code);
  const { closeModal, replaceModal } = use(ModalContext);
  const deactivateLobby = useDeactivateLobby();
  const blackjackMatch = useMatch({ from: '/lobby/$code/blackjack', shouldThrow: false });
  const rouletteMatch = useMatch({ from: '/lobby/$code/roulette', shouldThrow: false });

  const handleDeactivateLobby = useCallback(
    async (lobbyId: string) => {
      await deactivateLobby.mutateAsync(lobbyId);
      window.location.reload();
    },
    [deactivateLobby],
  );

  useEffect(() => {
    if (lobby && lobby?.status === LobbyState.INACTIVE) {
      closeModal(true);
    }
  }, [lobby?.status, lobby, closeModal]);

  const handleCloseConfirmationModal = () => {
    if (blackjackMatch && lobby?.isBlackjackEnabled) {
      if (lobby.bankroll > lobby.minBet)
        return replaceModal(() => ({
          key: 'edit-lobby',
          props: { lobbyId: lobby?.id },
          closable: false,
          lightBlur: true,
        }));
      replaceModal(() => ({
        key: 'bankroll-insufficient-funds',
        props: { code, game: LobbyGame.BLACKJACK },
        closable: false,
        lightBlur: true,
      }));
    } else if (rouletteMatch && lobby?.isRouletteEnabled) {
      if (lobby.rouletteBankroll > lobby.rouletteMinBet)
        return replaceModal(() => ({
          key: 'edit-lobby',
          props: { lobbyId: lobby?.id },
          closable: true,
        }));
      replaceModal(() => ({
        key: 'bankroll-insufficient-funds',
        props: { code, game: LobbyGame.ROULETTE },
        closable: false,
        lightBlur: true,
      }));
    } else {
      closeModal(true);
    }
  };

  return (
    <div className="flex min-h-[280px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-center border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className="text-[24px] text-white">Close Lobby</span>
        </div>
      </div>
      <div className="w-full py-6 text-lg font-extrabold text-[#6E88AF]">
        {credentials?.user === lobby?.ownerId ? (
          <div className="flex w-full flex-col items-center justify-center gap-5">
            <div className="flex w-full flex-col items-center justify-center gap-1 border-b border-b-[#12223B] text-center">
              <div className="text-xl font-bold text-white">Are you sure you would like to close this lobby?</div>
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="font-semibold text-[#6E88AF]">
                  If Bankroll is still in this lobby, it will be added back to your on-site balance.
                </div>
                <div className="text-sm font-semibold wrap-normal text-[#6E88AF]">
                  A 5% fee will be taken from any current profits.
                </div>
              </div>
            </div>
            <div className="flex w-full items-center justify-center gap-6 px-9 max-md:px-3.5">
              <div
                onClick={() => handleDeactivateLobby(lobby?.id)}
                className="btn-common btn-primary hover-base items-center max-sm:justify-center max-sm:!py-3"
              >
                Yes
              </div>
              <div
                onClick={handleCloseConfirmationModal}
                className="btn-common btn-secondary hover-base items-center max-sm:justify-center max-sm:!py-3"
              >
                Cancel
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-5">
            <div>This lobby is currently {lobby?.status === LobbyState.PAUSED ? 'paused' : 'closed'}.</div>
            <div className="w-full px-9 max-md:px-3.5">
              <Link
                to="/lobby-list"
                onClick={() => closeModal()}
                className="absolute bottom-[28px] left-1/2 -translate-x-1/2 cursor-pointer rounded-[5px] bg-[#1D3353] px-6 py-3 font-bold text-[#6E88AF] transition-colors duration-200 hover:text-white"
              >
                Full lobby list
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
