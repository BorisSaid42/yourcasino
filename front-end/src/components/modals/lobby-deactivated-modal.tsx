import { Link, useRouterState } from '@tanstack/react-router';
import { use, useCallback, useEffect } from 'react';
import { ModalContext, ModalProps } from '../../providers/modal/context';
import { useCredentials } from '../../queries/auth';
import { LobbyState, useActivateLobby, useLobbyData } from '../../queries/lobby';
import { GenericButton } from '../common/buttons';
import { useQueryClient } from '@tanstack/react-query';

export const LobbyDeactivatedModal = ({ code }: ModalProps<'lobby-deactivated'>) => {
  const { data: credentials } = useCredentials();
  const { data: lobby } = useLobbyData(code);
  const { closeModal, replaceModal } = use(ModalContext);
  const activateLobby = useActivateLobby();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (lobby && lobby?.status === LobbyState.ACTIVE) {
      closeModal(true);
    }
  }, [lobby?.status, lobby, closeModal]);

  const handleActivateLobby = useCallback(
    async (lobbyId: string) => {
      await activateLobby.mutateAsync(lobbyId);
      queryClient.invalidateQueries({ queryKey: ['roulette', 'game', 'current', lobbyId] });
      queryClient.invalidateQueries({ queryKey: ['blackjack', 'game', 'current', lobbyId] });
      queryClient.invalidateQueries({ queryKey: ['lobby', 'details', code.toUpperCase()] });
    },
    [activateLobby, code, queryClient],
  );

  const handleEditLobby = useCallback(
    (lobbyId: string) => {
      replaceModal(() => ({
        key: 'edit-lobby',
        props: { lobbyId },
        closable: false,
        lightBlur: true,
      }));
    },
    [replaceModal],
  );

  const { location } = useRouterState();

  const isRoulette = location.pathname.endsWith('/roulette');
  const isBlackjack = location.pathname.endsWith('/blackjack');

  const handleEditBankroll = useCallback(() => {
    if (!isBlackjack && !isRoulette) {
      return;
    }

    replaceModal(() => ({
      key: 'add-bankroll-funds',
      props: { code, game: isRoulette ? 'roulette' : 'blackjack' },
      closable: false,
      lightBlur: true,
    }));
  }, [code, isBlackjack, isRoulette, replaceModal]);

  return (
    <div className="flex min-h-[230px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-center border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className={`'text-white`}>Lobby {lobby?.status === LobbyState.PAUSED ? 'paused' : 'closed'}</span>
        </div>
      </div>
      <div className="w-full py-6 text-lg font-extrabold text-[#6E88AF]">
        {credentials?.user === lobby?.ownerId ? (
          <div className="flex w-full flex-col items-center justify-center gap-5">
            <div>You have {lobby?.status === LobbyState.PAUSED ? 'paused' : 'closed'} this lobby.</div>
            <div className="flex w-full flex-col items-center justify-center gap-3">
              <div className="flex w-full items-center justify-center gap-3 px-9 max-md:px-3.5">
                {lobby?.status === LobbyState.PAUSED && (
                  <>
                    <GenericButton
                      onClick={() => handleEditLobby(lobby.id)}
                      className="!py-2 max-sm:justify-center"
                      skin="primary"
                      text="Edit Lobby"
                      isFullWidth={true}
                    />
                    <GenericButton
                      onClick={() => handleEditBankroll()}
                      className="!py-2 max-sm:justify-center"
                      skin="primary"
                      text="Edit Bankroll"
                      isFullWidth={true}
                    />
                  </>
                )}
              </div>
              <div className="flex w-full items-center justify-center gap-3 px-9 max-md:px-3.5">
                {lobby?.status === LobbyState.PAUSED && (
                  <GenericButton
                    onClick={() => handleActivateLobby(lobby.id)}
                    className="!py-2 max-sm:justify-center"
                    skin="primary"
                    text="Activate"
                    isFullWidth={true}
                  ></GenericButton>
                )}
                <Link
                  to="/lobby-list"
                  onClick={() => closeModal()}
                  className="w-full cursor-pointer rounded-[5px] bg-[#1D3353] px-6 py-2 text-center font-bold text-[#6E88AF] transition-colors duration-200 hover:text-white"
                >
                  Full lobby list
                </Link>
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
