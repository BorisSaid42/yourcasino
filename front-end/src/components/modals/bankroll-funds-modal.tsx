import { useStore } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { use, useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import crossIcon from '../../assets/icons/common/cross-icon.svg';
import dollarIcon from '../../assets/icons/common/dollar-icon.svg';
import plusIcon from '../../assets/icons/common/plus-icon.svg';
import { classNames, formatBalance } from '../../lib/utils';
import { ModalContext, ModalProps } from '../../providers/modal/context';
import { SocketLockContext } from '../../providers/socket-locks/context';
import { useCredentials } from '../../queries/auth';
import { AddBankrollActionEnum, LobbyState, useAddBankroll, useLobbyData } from '../../queries/lobby';
import { useAppForm } from '../form/provider';
import { notify } from '../toast';

const MAX_BANKROLL = 1000000;

const bankrollSchema = z.object({
  bankroll: z.coerce.number().positive().min(0.1).max(MAX_BANKROLL),
  action: z.nativeEnum(AddBankrollActionEnum),
});

export const BankrollFundsModal = ({ code, game }: ModalProps<'add-bankroll-funds'>) => {
  const { data: credentials } = useCredentials();
  const { data: lobby } = useLobbyData(code);
  const { closeModal, replaceModal } = use(ModalContext);
  const { isLocked, setLock } = use(SocketLockContext);
  const updateBankroll = useAddBankroll(lobby?.id || '');
  const [lobbyNetProfit, setLobbyNetProfit] = useState(0);
  const [netProfitSign, setNetProfitSign] = useState('');
  const [amountToReceive, setAmountToReceive] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [netProfitTextColor, setNetProfitTextColor] = useState('text-white');

  const form = useAppForm({
    onSubmit: async ({ value }) => {
      setLock('add-bankroll', true);
      await updateBankroll.mutateAsync(
        {
          bankroll: value.bankroll,
          game: game,
          action: value.action,
        },
        {
          onSuccess: () => {
            if (value.action === AddBankrollActionEnum.WITHDRAW) {
              notify('success', { content: 'Successfully withdrawn bankroll funds', title: 'Bankroll withdraw' });
            } else {
              notify('success', { content: 'Successfully added bankroll funds', title: 'Bankroll top up' });
            }
            setLock('add-bankroll', false);
          },
          onError: () => {
            setLock('add-bankroll', false);
          },
        },
      );

      setLock('add-bankroll', false);
      handleCloseModal();
    },
    validators: {
      onSubmit: bankrollSchema,
    },
    defaultValues: {
      bankroll: 0,
      action: AddBankrollActionEnum.ADD,
    },
  });

  const formAmount = useStore(form.store, (state) => state.values.bankroll);

  useEffect(() => {
    if (!lobby) return;

    setLobbyNetProfit(game === 'blackjack' ? lobby.blackjackProfitAmount : lobby.rouletteProfitAmount);

    const isPositive = lobbyNetProfit > 0;
    const isNegative = lobbyNetProfit < 0;

    setNetProfitSign(isPositive ? '+' : isNegative ? '-' : '');
    setNetProfitTextColor(isPositive ? 'text-[#4EC87D]' : isNegative ? 'text-[#FF5656]' : 'text-white');

    setAmountToReceive(formAmount);

    if (lobbyNetProfit > 0 && lobbyNetProfit > formAmount) {
      setFeeAmount(formAmount * 0.05);
      setAmountToReceive(formAmount - formAmount * 0.05);
    }

    if (lobbyNetProfit > 0 && lobbyNetProfit <= formAmount) {
      setFeeAmount(lobbyNetProfit * 0.05);
      setAmountToReceive(formAmount - lobbyNetProfit * 0.05);
    }
  }, [form, formAmount, game, lobby, lobbyNetProfit]);

  const handleCloseModal = useCallback(() => {
    if (lobby?.status === LobbyState.PAUSED) {
      return replaceModal(() => ({
        key: 'lobby-deactivated',
        props: { code: lobby.code },
        closable: false,
        lightBlur: true,
      }));
    }

    closeModal();
  }, [closeModal, lobby?.code, lobby?.status, replaceModal]);

  return (
    <div className="flex min-h-[260px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-between border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className={`'text-white`}>Bankroll Balance</span>
        </div>
        <button onClick={handleCloseModal} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      <div className="w-full py-6 text-lg font-bold">
        {credentials?.user === lobby?.ownerId ? (
          <div className="flex w-full flex-col items-center justify-center gap-5">
            <div className="text-base text-[#6E88AF]">Enter the amount you want to add/withdraw</div>
            <div className="text-xl font-extrabold text-[#8FAABF]">
              Current bankroll balance:{' '}
              {game === 'blackjack' ? (
                <span className="text-white">${formatBalance(lobby.bankroll)}</span>
              ) : (
                <span className="text-white">${formatBalance(lobby.rouletteBankroll)}</span>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();

                form.handleSubmit();
              }}
              className="flex w-full flex-col items-center gap-5"
            >
              <div>
                <form.AppField
                  name="bankroll"
                  children={(field) => (
                    <field.NumberField
                      className="relative gap-2"
                      labelProps={{
                        children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Amount</div>,
                      }}
                      inputProps={{
                        placeholder: '0.00',
                        decimals: 2,
                        step: '0.1',
                        className:
                          'pl-9 bg-[#08152A] border border-[#253C60] text-base placeholder-[#6E88AF] text-[#6E88AF] relative',
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
              <form.AppForm>
                <div className="flex w-full items-center justify-center gap-4">
                  <form.SubmitButtonAlt
                    type="submit"
                    onClick={() => form.setFieldValue('action', AddBankrollActionEnum.ADD)}
                    className={classNames(
                      'flex w-[150px] cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-[#4486DDDD] px-4 py-2 text-base font-bold hover:bg-[#4486DD]',
                      isLocked('bankroll-action') ? 'cursor-default opacity-50' : '',
                    )}
                    leftIcon={<img src={plusIcon} />}
                    text="Add"
                    padding="px-4 py-2"
                  ></form.SubmitButtonAlt>

                  <form.SubmitButtonAlt
                    type="submit"
                    onClick={() => form.setFieldValue('action', AddBankrollActionEnum.WITHDRAW)}
                    className={classNames(
                      'flex w-[150px] cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-[#1D3353DD] px-4 py-2 text-base font-bold hover:bg-[#1D3353]',
                      isLocked('bankroll-action') ? 'cursor-default opacity-50' : '',
                    )}
                    leftIcon={<img src={dollarIcon} />}
                    text="Withdraw"
                    padding="px-4 py-2"
                  ></form.SubmitButtonAlt>
                </div>
              </form.AppForm>
            </form>
            {lobby && (
              <div className="flex flex-col items-center justify-center text-center text-sm wrap-normal text-[#6E88AF]">
                <div>Withdrawals have a 5% fee only if your lobby game is in profit.</div>
                <div>5% of the total table profit is charged with any cashout amount.</div>
                <div>
                  Your {game} profit:{' '}
                  <span className={classNames('font-bold text-white', netProfitTextColor)}>
                    {netProfitSign}$
                    {Math.abs(lobbyNetProfit).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {lobbyNetProfit > 0 && feeAmount > 0 && (
                  <div>
                    Fee (5%):{' '}
                    <span className="font-bold text-white">
                      $
                      {feeAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {formAmount > 0 && (
                  <div>
                    You will receive:{' '}
                    <span className="font-bold text-white">
                      $
                      {amountToReceive > 0
                        ? amountToReceive.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '0.00'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-5">
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
