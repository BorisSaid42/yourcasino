import { Link } from '@tanstack/react-router';
import tooltipIcon from '../../../assets/icons/common/tooltip-icon.svg';
import btcIcon from '../../../assets/icons/payment-methods/bitcoin-logo.png';
import solIcon from '../../../assets/icons/payment-methods/solana-icon.png';
import ethIcon from '../../../assets/icons/payment-methods/eth-icon.png';
import ltcIcon from '../../../assets/icons/payment-methods/lite-coin-icon.png';
import usdtIcon from '../../../assets/icons/payment-methods/usdt-icon.png';
import linkIcon from '../../../assets/icons/common/link-icon.svg';
import { EmptyList } from '../../empty-list/empty-list';
import {
  BreakpointEnum,
  capitalizeFirstLetter,
  classNames,
  formatBalance,
  formatDateTime,
  mapCryptoSymbolToName,
  mapTxHashToLink,
  useBreakpoint,
} from '../../../lib/utils';
import { UserTransactionStatus, useTransactionHistory } from '../../../queries/transaction';
import { useState } from 'react';
import { TRANSACTION_HEADERS } from './transactions-modal';
import { GenericButton } from '../../common/buttons';

const cryptoIcons: Record<string, string> = {
  BTC: btcIcon,
  ETH: ethIcon,
  SOL: solIcon,
  LTC: ltcIcon,
  USDT: usdtIcon,
};

export const DepositHistory = () => {
  const isSmallerScreen = useBreakpoint(BreakpointEnum.MD);
  const [page, setPage] = useState(1);
  const { data: depositHistory } = useTransactionHistory(page, 'deposit');

  return (
    <div className="flex w-full flex-col">
      {!!depositHistory?.data.length && (
        <div className="w-full bg-[#12223B] px-9 max-md:px-3.5">
          <div className="grid grid-cols-[1.5fr_1.5fr_2fr_2fr_0.5fr] gap-4 py-2 text-[#6E88AF8F] max-md:grid-cols-[2fr_2fr_3fr_1fr]">
            {TRANSACTION_HEADERS.map((depositHeader, idx) => (
              <div
                className={`text-center font-extrabold ${idx === 3 ? 'max-md:hidden' : ''}`}
                key={`deposit-history-header-${depositHeader.value}`}
              >
                {depositHeader.value}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="w-full px-9 max-md:p-0">
        {depositHistory?.data.length ? (
          <div className="flex flex-col gap-3 pt-6 pb-8 max-md:gap-0.5">
            {depositHistory.data.map((depositTransaction, idx) => (
              <div key={`deposit-transaction-row-${idx}`} className="flex flex-col max-md:bg-[#253C60]">
                <div className="grid grid-cols-[1.5fr_1.5fr_2fr_2fr_0.5fr] gap-4 rounded-[8px] bg-[#253C60] py-3 max-md:grid-cols-[2fr_2fr_3fr_1fr] max-md:rounded-none max-md:px-4 max-md:pb-0">
                  <div className="flex items-center justify-start gap-2 pl-3 font-extrabold text-[#6E88AF] max-sm:justify-start">
                    {depositTransaction.symbol && <img width={24} src={cryptoIcons[depositTransaction.symbol]} />}
                    {isSmallerScreen ? depositTransaction.symbol : mapCryptoSymbolToName(depositTransaction.symbol)}
                  </div>
                  <div className="flex items-center justify-center font-bold">
                    +$
                    {formatBalance(depositTransaction.amount)}
                  </div>
                  <div
                    className={`ml-5 flex items-center justify-center gap-1.5 text-xs font-extrabold ${depositTransaction.status === UserTransactionStatus.PENDING || depositTransaction.status === UserTransactionStatus.FAILED ? 'text-[#465B7C]' : depositTransaction.status === UserTransactionStatus.COMPLETED ? 'text-[#4EC87D]' : 'text-[#60A4FD]'}`}
                  >
                    {capitalizeFirstLetter(depositTransaction.status)}

                    {depositTransaction.status === UserTransactionStatus.FAILED && (
                      <div className="group relative">
                        <img src={tooltipIcon} alt="Failed transaction" />

                        <div className="absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                          {depositTransaction.externalStatus}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center font-bold text-[#6E88AF] max-md:hidden">
                    {formatDateTime(depositTransaction.createdAt)}
                  </div>
                  <div className="flex items-center justify-center pr-3 max-md:pr-0">
                    <Link
                      className={classNames(
                        'flex min-h-7 w-[46px] items-center justify-center rounded-[5px] bg-[#1D3353] py-1.5 duration-500 hover:bg-[#182B46]',
                        !depositTransaction.txHash ? 'pointer-events-none cursor-default opacity-40' : '',
                      )}
                      to={mapTxHashToLink(depositTransaction.symbol, depositTransaction.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={linkIcon} />
                    </Link>
                  </div>
                </div>
                <div className="hidden max-md:flex max-md:items-center max-md:justify-start max-md:pt-2 max-md:pr-4 max-md:pb-2 max-md:pl-[23px] max-md:text-xs max-md:text-[#6E88AF]">
                  {formatDateTime(depositTransaction.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyList text="NO DEPOSIT DATA" />
        )}
        {!!depositHistory?.data.length && (
          <div className="mb-8 flex items-center justify-center gap-3">
            <GenericButton
              skin="secondaryDark"
              onClick={() => setPage((p) => (p <= depositHistory.totalPages ? p - 1 : p))}
              isDisabled={page <= 1}
              className="min-h-12 min-w-[60px] text-[#6E88AF] disabled:opacity-[24%]"
              text="Prev"
            ></GenericButton>
            <div className="flex min-w-[108px] items-center justify-center rounded-[5px] border border-[#253C60] py-4 font-bold disabled:cursor-default disabled:opacity-[24%]">
              {depositHistory.page}/{depositHistory.totalPages} Pages
            </div>
            <GenericButton
              skin="secondaryDark"
              onClick={() => setPage((p) => (p < depositHistory.totalPages ? p + 1 : p))}
              isDisabled={depositHistory.page >= depositHistory.totalPages}
              className="min-h-12 min-w-[60px] text-[#6E88AF] disabled:opacity-[24%]"
              text="Next"
            ></GenericButton>
          </div>
        )}
      </div>
    </div>
  );
};
