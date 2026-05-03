import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import copyIcon from '../../../assets/icons/common/copy-icon.svg';
import checkIcon from '../../../assets/icons/common/check-icon-green.svg';
import backIcon from '../../../assets/icons/common/go-back.svg';
import dolarIcon from '../../../assets/icons/dollar-sign.svg';
import { IPaymentMethod } from '../../../lib/payment-methods';
import { BreakpointEnum, classNames, useBreakpoint } from '../../../lib/utils';
import { useAssetDepositAddress } from '../../../queries/crypto';
import { notify } from '../../toast';

interface IDepositDetailsProps {
  method: IPaymentMethod;
  handleDepositMethod: (method: IPaymentMethod | null) => void;
}

export const DepositDetails = ({ method, handleDepositMethod }: IDepositDetailsProps) => {
  const { data: depositAddress } = useAssetDepositAddress(method?.symbol);
  const [depositAmount, setDepositAmount] = useState('1');
  const [depositDollarValue, setDepositDollarValue] = useState(method?.valuePerItem);
  const [minDepositValue, setMinDepositValue] = useState('0');
  const isXXSScreen = useBreakpoint(BreakpointEnum.XXS);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!depositAddress) return;
    await navigator.clipboard
      .writeText(depositAddress ?? '')
      .then(() => {
        notify('success', { title: 'Success', content: 'Copied to clipboard' });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  const sliceText = (text: string, chars = 10) => {
    if (!text) return '';
    return text.length > chars * 2 ? `${text.slice(0, chars)}...${text.slice(-chars)}` : text;
  };

  const handleDepositAmount = (amount: string) => {
    const rawAmount = amount?.replace(/,/g, '') ?? '0';
    const amountValue = parseFloat(rawAmount);

    const rawValue = method.valuePerItem?.replace(/,/g, '') ?? '0';
    const assetValue = parseFloat(rawValue);

    setDepositAmount(amount);
    const convertedAmount = isNaN(amountValue) ? 0 : assetValue * amountValue;
    setDepositDollarValue(
      convertedAmount?.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  };

  useEffect(() => {
    const rawValue = method.valuePerItem?.replace(/,/g, '') ?? '0';
    const assetValue = parseFloat(rawValue);

    const depositMinValue = 5 / assetValue;
    setMinDepositValue(
      depositMinValue?.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      }),
    );
  }, [method]);

  return (
    <div className="flex w-full flex-col py-6">
      {depositAddress && (
        <QRCode
          value={depositAddress}
          className="mx-auto aspect-square max-h-[116px] max-w-[116px] rounded-lg bg-white p-2.5"
        />
      )}
      <div className="mt-5 text-center text-xs font-extrabold text-[#60A4FD]">{method.symbol} Deposit Address</div>
      <div className="mt-3 mb-5 flex w-full flex-col gap-4 px-9 max-md:px-3.5">
        <div className="flex items-center gap-2 rounded-[5px] bg-[#253C60] px-[18px] py-[14px]">
          <img src={method.icon} width={20} />
          {!depositAddress ? (
            <div className="text-sm font-bold text-[#6E88AF]">Loading address...</div>
          ) : (
            <div className="text-sm font-bold">{isXXSScreen ? sliceText(depositAddress, 15) : depositAddress}</div>
          )}
        </div>
        <button
          onClick={handleCopy}
          disabled={!depositAddress}
          className={classNames(
            'flex cursor-pointer items-center justify-center gap-3 rounded-[5px] bg-[#1D3353] px-[18px] py-[14px]',
            !depositAddress ? 'cursor-default opacity-[0.5]' : '',
          )}
        >
          {isCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
          <span className="text-sm font-bold text-[#6E88AF]">{isCopied ? 'Coppied To Clipboard' : 'Copy Address'}</span>
        </button>
      </div>
      <div className="flex flex-col items-center border-b border-[#12223B] pb-5">
        {depositDollarValue && (
          <div className="flex items-center text-center font-medium text-[#6E88AF8F] max-sm:flex-col">
            <div>* You must deposit a minimum of </div>
            <div className="mx-2 flex items-center gap-1 font-bold text-white">
              <img src={method.icon} width={14} />
              <div>{minDepositValue}</div>
              <div>{' ($5.00)'}</div>*
            </div>{' '}
          </div>
        )}
        <div className="flex items-center text-center font-medium text-[#6E88AF8F] max-sm:flex-col">
          <div>* Deposits require at least </div>
          <div className="mx-2 flex items-center gap-1 font-bold text-white">
            {method.confirmations} Confirmation{method.confirmations > 1 ? 's' : ''} *
          </div>{' '}
        </div>
        <div className="flex items-center text-center font-medium text-[#6E88AF8F]">
          <div>* Make sure you only deposit the provided address *</div>
        </div>
      </div>
      <div className="mt-6 mb-8 flex flex-col gap-3 px-9 max-md:px-3.5">
        <div className="gap-3 text-center text-sm font-extrabold text-[#6E88AF8F]">Currency Converter</div>
        <div className="flex w-full gap-3 max-md:flex-col">
          <div className="flex w-full gap-2 rounded-[5px] border border-[#253C60] bg-[#08152A] px-5 py-[14px]">
            <img src={method.icon} width={20} />
            <input
              value={depositAmount}
              onChange={(e) => handleDepositAmount(e.target.value)}
              type="text"
              className="text-sm font-extrabold focus:border-transparent focus:ring-0 focus:outline-none"
              onFocus={(e) => {
                e.target.select();
              }}
            />
          </div>
          <div className="flex w-full gap-2 rounded-[5px] border border-[#253C60] bg-[#08152A] px-5 py-[14px] font-bold">
            <img src={dolarIcon} width={12} />
            <input
              value={depositDollarValue}
              disabled
              type="text"
              className="focus:border-transparent focus:ring-0 focus:outline-none"
            />
          </div>
        </div>
      </div>
      <div
        onClick={() => handleDepositMethod(null)}
        className="btn-common btn-secondary ml-9 flex w-[140px] cursor-pointer items-center justify-center gap-3 hover:opacity-85"
      >
        <img className="w-[15px]" src={backIcon} />
        <span>Go Back</span>
      </div>
    </div>
  );
};
