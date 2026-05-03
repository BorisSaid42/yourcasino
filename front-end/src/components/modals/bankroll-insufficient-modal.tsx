import { Link, useMatch } from '@tanstack/react-router';
import { use, useCallback, useEffect } from 'react';
import { z } from 'zod';
import dollarIcon from '../../assets/icons/common/dollar-icon.svg';
import plusIcon from '../../assets/icons/common/plus-icon.svg';
import { classNames } from '../../lib/utils';
import { ModalContext, ModalProps } from '../../providers/modal/context';
import { SocketLockContext } from '../../providers/socket-locks/context';
import { useCredentials } from '../../queries/auth';
import { AddBankrollActionEnum, LobbyGame, useAddBankroll, useLobbyData } from '../../queries/lobby';
import { useAppForm } from '../form/provider';

const MAX_BANKROLL = 1000000;

const bankrollSchema = z.object({
  bankroll: z.coerce.number().positive().min(0.1).max(MAX_BANKROLL),
});

export const BankrollInsufficientModal = ({
  code,
  game,
  canPlayRoulette,
  canPlayBlackjack,
}: ModalProps<'bankroll-insufficient-funds'>) => {
  const { data: credentials } = useCredentials();
  const { data: lobby } = useLobbyData(code);
  const { closeModal, replaceModal } = use(ModalContext);
  const { isLocked, setLock } = use(SocketLockContext);
  const updateBankroll = useAddBankroll(lobby?.id || '');
  const blackjackMatch = useMatch({ from: '/lobby/$code/blackjack', shouldThrow: false });
  const rouletteMatch = useMatch({ from: '/lobby/$code/roulette', shouldThrow: false });

  const handleDeactivateLobby = useCallback(() => {
    replaceModal((prevOptions) => ({
      key: 'closing-lobby-confirmation-modal',
      props: { code },
      closable: prevOptions.closable,
    }));
  }, [code, replaceModal]);

  const handleDeactivateGame = useCallback(() => {
    replaceModal((prevOptions) => ({
      key: 'closing-game-confirmation-modal',
      props: { code, game: blackjackMatch ? LobbyGame.BLACKJACK : LobbyGame.ROULETTE },
      closable: prevOptions.closable,
    }));
  }, [blackjackMatch, code, replaceModal]);

  useEffect(() => {
    if (lobby && lobby.isBlackjackEnabled && blackjackMatch && lobby.bankroll > lobby.minBet) {
      closeModal(true);
    }
    if (lobby && lobby.isRouletteEnabled && rouletteMatch && lobby.rouletteBankroll > lobby.rouletteMinBet) {
      closeModal(true);
    }
  }, [blackjackMatch, closeModal, lobby, rouletteMatch]);

  const form = useAppForm({
    onSubmit: async ({ value }) => {
      setLock('add-bankroll', true);
      await updateBankroll.mutateAsync(
        {
          bankroll: value.bankroll,
          game: game,
          action: AddBankrollActionEnum.ADD,
        },
        {
          onError: () => {
            setLock('add-bankroll', false);
          },
        },
      );

      setLock('add-bankroll', false);
      closeModal(true);
    },
    validators: {
      onSubmit: bankrollSchema,
    },
    defaultValues: {
      bankroll: 0,
    },
  });

  return (
    <div className="flex min-h-[260px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-center border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className={`'text-white`}>Insufficient Bankroll Balance</span>
        </div>
      </div>
      <div className="flex w-full flex-1 py-6 text-lg font-extrabold text-[#6E88AF]">
        {credentials?.user === lobby?.ownerId ? (
          <div className="flex w-full flex-col items-center justify-center gap-5">
            <div>Lobby bankroll balance is low, please refill</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();

                form.handleSubmit();
              }}
              className="flex w-full flex-col items-center justify-center gap-5"
            >
              <div className="min-w-[60%]">
                <form.AppField
                  name="bankroll"
                  children={(field) => (
                    <field.NumberField
                      className="relative gap-2"
                      labelProps={{
                        children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Bankroll</div>,
                      }}
                      inputProps={{
                        placeholder: '0.00',
                        decimals: 2,
                        step: '0.1',
                        className:
                          'pl-9 bg-[#08152A]  border border-[#253C60] text-base placeholder-[#6E88AF] text-[#6E88AF] relative',
                        onFocus: (e) => {
                          if (+e.target.value === 0) {
                            e.target.value = '';
                          }
                        },
                      }}
                    >
                      <img
                        className="pointer-events-none absolute top-[40px] left-5 min-w-3 select-none"
                        src={dollarIcon}
                      />
                    </field.NumberField>
                  )}
                />
              </div>
              <div className="flex w-full justify-center gap-6">
                <form.AppForm>
                  <form.SubmitButton
                    className={classNames(
                      'btn-common btn-primary flex max-w-[130px] items-center justify-center gap-2 max-sm:!py-3',
                      isLocked('add-bankroll') ? 'cursor-default opacity-0.5' : '',
                    )}
                  >
                    <img src={plusIcon} />
                    Add
                  </form.SubmitButton>
                </form.AppForm>
                {lobby.isBlackjackEnabled && lobby.isRouletteEnabled && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeactivateGame();
                    }}
                    className="btn-common btn-secondary"
                  >
                    Close {blackjackMatch ? 'Blackjack' : rouletteMatch ? 'Roulette' : ''} Game
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeactivateLobby();
                  }}
                  className="btn-common btn-secondary"
                >
                  Close Lobby
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-between gap-5">
            <div>Please wait until lobby bankroll is refilled</div>
            <div className="flex w-full flex-row items-center justify-center gap-4 px-9 max-md:px-3.5">
              <Link
                to="/lobby-list"
                onClick={() => closeModal()}
                className="bottom-[28px] cursor-pointer rounded-[5px] bg-[#1D3353] px-6 py-3 font-bold text-[#6E88AF] transition-colors duration-200 hover:text-white"
              >
                Full lobby list
              </Link>
              {lobby?.code && canPlayRoulette && (
                <Link
                  to="/lobby/$code/roulette"
                  params={{ code: lobby?.code }}
                  onClick={() => closeModal()}
                  className="bottom-[28px] cursor-pointer rounded-[5px] bg-[#1D3353] px-6 py-3 font-bold text-[#6E88AF] transition-colors duration-200 hover:text-white"
                >
                  Go to roulette
                </Link>
              )}
              {lobby?.code && canPlayBlackjack && (
                <Link
                  to="/lobby/$code/blackjack"
                  params={{ code: lobby?.code }}
                  onClick={() => closeModal()}
                  className="bottom-[28px] cursor-pointer rounded-[5px] bg-[#1D3353] px-6 py-3 font-bold text-[#6E88AF] transition-colors duration-200 hover:text-white"
                >
                  Go to blackjack
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
