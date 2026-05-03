import { useField, useStore } from '@tanstack/react-form';
import { use, useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import backIcon from '../../../assets/icons/common/go-back.svg';
import dollarIcon from '../../../assets/icons/dollar-sign.svg';
import { IPaymentMethod } from '../../../lib/payment-methods';
import { BreakpointEnum, classNames, useBreakpoint } from '../../../lib/utils';
import { ModalContext } from '../../../providers/modal/context';
import { SocketLockContext } from '../../../providers/socket-locks/context';
import { useCredentials } from '../../../queries/auth';
import { useEstimateTxFee, useWithdrawCrypto } from '../../../queries/crypto';
import { useAppForm } from '../../form/provider';
import { useUser } from '../../../queries/user';

interface IWithdrawDetailsProps {
  selectedMethod: IPaymentMethod;
  handleWithdrawMethod: (method: IPaymentMethod | null) => void;
}

const MAX_WITHDRAW = 100000;

const lobbySchema = z.object({
  walletAddress: z.coerce.string().min(1, 'Wallet address is required'),
  withdrawAmount: z.coerce
    .number()
    .gte(10, 'Withdraw amount must be at least $10.00')
    .max(MAX_WITHDRAW, `Withdraw can't exceed ${MAX_WITHDRAW}`),
});

export const WithdrawDetails = ({ selectedMethod, handleWithdrawMethod }: IWithdrawDetailsProps) => {
  const { closeModal } = use(ModalContext);
  const [withdrawCoinAmount, setWithdrawCoinAmount] = useState('0.00');
  const [withdrawCoinAmountNumeric, setWithdrawCoinAmountNumeric] = useState(0);
  const [withdrawUsdAmount, setWithdrawUsdAmount] = useState(0);
  const { data: estimatedNetworkFee } = useEstimateTxFee(selectedMethod.symbol);
  const withdrawCrypto = useWithdrawCrypto();
  const { data: credentials } = useCredentials();
  const isXXSScreen = useBreakpoint(BreakpointEnum.XXS);
  const { data: user } = useUser();

  const { isLocked, setLock } = use(SocketLockContext);

  const form = useAppForm({
    onSubmit: async ({ value }) => {
      setLock('withdraw-submitted', true);
      await withdrawCrypto.mutateAsync(
        {
          walletAddress: value.walletAddress,
          withdrawAmount: withdrawCoinAmountNumeric,
          withdrawAmountUsd: +value.withdrawAmount,
          asset: selectedMethod.symbol,
        },
        {
          onError: () => {
            setLock('withdraw-submitted', false);
          },
        },
      );

      closeModal(true);
      setLock('withdraw-submitted', false);
      withdrawCrypto.reset();
    },
    validators: {
      onSubmit: lobbySchema,
    },
    defaultValues: {
      walletAddress: '',
      withdrawAmount: 0,
    },
  });

  const withdrawAmountField = useField({
    form,
    name: 'withdrawAmount',
  });

  useEffect(() => {
    const rawValue = withdrawAmountField.state.value;
    const value = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;

    const rawAssetValue = selectedMethod.valuePerItem?.replace(/,/g, '') ?? '0';
    const assetValue = parseFloat(rawAssetValue);

    if (!isNaN(value) && !isNaN(assetValue) && assetValue !== 0 && value > 0) {
      setWithdrawUsdAmount(value);
      const convertedAmount = value / assetValue;
      setWithdrawCoinAmountNumeric(convertedAmount);
      setWithdrawCoinAmount(
        convertedAmount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        }),
      );
    } else {
      setWithdrawCoinAmountNumeric(0);
      setWithdrawCoinAmount('0.00');
      setWithdrawUsdAmount(0);
    }
  }, [selectedMethod.valuePerItem, withdrawAmountField.state.value]);

  const handleMax = useCallback(() => {
    form.setFieldValue('withdrawAmount', user?.balance || 0);
  }, [user?.balance, form]);

  const walletAddress = useStore(form.store, (state) => state.values.walletAddress);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!credentials?.user) {
          return;
        }

        if (!isLocked('withdraw-submitted')) {
          form.handleSubmit();
        }
      }}
      className="flex flex-col py-6"
    >
      <div className="relative flex flex-col px-9 pb-6 max-md:px-3.5">
        <div className="relative">
          <form.AppField
            name="walletAddress"
            children={(field) => (
              <field.TextField
                labelProps={{
                  children: (
                    <div className="mb-3 text-center text-xs font-extrabold text-white">
                      {selectedMethod.symbol} Withdraw Address
                    </div>
                  ),
                }}
                inputProps={{
                  placeholder: 'Enter address',
                  className: 'pl-12! border border-[#253C60] bg-[#08152A]',
                  onFocus: (e) => {
                    e.target.select();
                  },
                }}
                className=""
              >
                <img
                  src={selectedMethod.icon}
                  width={20}
                  className="pointer-events-none absolute top-[44px] left-[16px] max-sm:top-[40px]"
                />
              </field.TextField>
            )}
          ></form.AppField>
        </div>
        <div className="mt-5 mb-3 text-center text-xs font-extrabold text-white">Withdraw Amount</div>
        <div className="flex items-center gap-3">
          <div className="relative w-full">
            <form.AppField
              name="withdrawAmount"
              children={(field) => (
                <field.NumberField
                  inputProps={{
                    placeholder: '0.00',
                    decimals: 2,
                    step: '0.1',
                    className: 'relative w-full pl-12 border border-[#253C60] bg-[#08152A]',
                    onFocus: (e) => {
                      e.target.select();
                    },
                  }}
                >
                  <img src={dollarIcon} width={12} className="pointer-events-none absolute bottom-[16px] left-[20px]" />
                  <button
                    onClick={handleMax}
                    type="button"
                    className="absolute right-[10px] bottom-[10px] cursor-pointer rounded-[5px] bg-[#1D3353] px-2 py-[5px] font-bold text-[#6E88AF]"
                  >
                    Max
                  </button>
                </field.NumberField>
              )}
            ></form.AppField>
          </div>
          <div className="flex w-full items-center gap-2 rounded-[5px] bg-[#253C60] px-5 py-[14px] font-bold">
            <img src={selectedMethod.icon} width={20} />
            <div>{withdrawCoinAmount}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-between gap-5 px-9 max-md:px-3.5">
        <div
          onClick={() => handleWithdrawMethod(null)}
          className="btn-common btn-secondary flex min-w-[140px] cursor-pointer items-center justify-center gap-3 hover:opacity-85"
        >
          <img className="w-[15px]" src={backIcon} />
          <span>Go Back</span>
        </div>
        <form.AppForm>
          <form.Field
            name="withdrawAmount"
            children={(field) => (
              <>
                <input
                  className="hidden"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
                <form.SubmitButtonAlt
                  disabled={Number(field.state.value) <= 0 || isLocked('withdraw-submitted') || !walletAddress}
                  skin="primary"
                  className={classNames(
                    'w-full gap-2 duration-500 disabled:cursor-default disabled:bg-[#253C60] disabled:text-white/25',
                  )}
                >
                  <div>Withdraw</div>
                  <img src={selectedMethod.icon} width={20} />
                  <div>{withdrawCoinAmount}</div>
                </form.SubmitButtonAlt>
              </>
            )}
          />
        </form.AppForm>
      </div>
      <div className="mt-4 flex flex-col items-center">
        <div className={classNames('flex items-center font-medium text-[#6E88AF8F]', isXXSScreen ? 'text-[9px]' : '')}>
          <div>* Minimum withdraw amount is </div>
          <div className="mx-2 flex items-center gap-1 font-bold text-white">$10.00</div> *
        </div>
        {estimatedNetworkFee && (
          <div
            className={classNames('flex items-center font-medium text-[#6E88AF8F]', isXXSScreen ? 'text-[8px]' : '')}
          >
            <div>* You will be charged a processing fee (%2) plus gas fee </div>
            <div className="mx-2 flex items-center gap-1 font-bold text-white">
              $
              <div>
                {(estimatedNetworkFee + withdrawUsdAmount * 0.02).toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}
              </div>
            </div>{' '}
            *
          </div>
        )}
      </div>
    </form>
  );
};
