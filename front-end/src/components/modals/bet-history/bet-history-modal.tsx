import { Link } from '@tanstack/react-router';
import { use, useState } from 'react';
import aceIcon from '../../../assets/icons/common/ace-icon.svg';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import linkIcon from '../../../assets/icons/common/link-icon.svg';
import { ModalContext } from '../../../providers/modal/context';
import { useRouletteBetHistory } from '../../../queries/bet';
import { EmptyList } from '../../empty-list/empty-list';
import { LobbyState } from '../../../queries/lobby';
import { GenericButton } from '../../common/buttons';

const BET_HISTORY_HEADERS = [{ value: 'Playing' }, { value: 'Bet' }, { value: 'Payout' }];

export const BetHistoryModal = () => {
  const { closeModal } = use(ModalContext);
  const [page, setPage] = useState(1);
  const { data: betHistory } = useRouletteBetHistory(page);

  return (
    <div className="flex min-h-[320px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-between border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className={`'text-white select-none`}>Bet History</span>
        </div>
        <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      {!!betHistory?.data?.length && (
        <div className="flex w-full flex-col">
          <div className="w-full bg-[#12223B] px-9 max-md:px-3.5">
            <div className="grid grid-cols-[5fr_2fr_1fr] py-2 text-[#6E88AF8F] max-sm:grid-cols-[200px_2fr_2fr]">
              {BET_HISTORY_HEADERS.map((betHistoryHeader, idx) => (
                <div
                  className={`font-extrabold ${idx + 1 === BET_HISTORY_HEADERS.length ? 'text-end' : ''}`}
                  key={`deposit-history-header-${betHistoryHeader.value}`}
                >
                  {betHistoryHeader.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="w-full px-9 max-md:p-0">
        <div className="flex flex-col gap-3 pt-6 pb-8 max-md:gap-0.5">
          {betHistory && betHistory.data?.length > 0 ? (
            betHistory.data.map((betHistoryItem, idx) => (
              <div
                key={`deposit-transaction-row-${idx}`}
                className="grid grid-cols-[5fr_2fr_1fr] rounded-[8px] bg-[#253C60] p-3 max-md:rounded-none max-sm:grid-cols-[200px_2fr_2fr]"
              >
                <div
                  className={`flex items-center gap-2 font-extrabold ${betHistoryItem?.inviteLink ? '' : 'text-[#465B7C]'}`}
                >
                  <img width={24} src={aceIcon} />
                  <span className="max-sm:mr-2 max-sm:inline-block max-sm:max-w-[200px] max-sm:truncate">
                    Table #{betHistoryItem.lobbyCode}
                  </span>
                  {betHistoryItem?.status === LobbyState.ACTIVE ? (
                    <Link
                      className="flex min-h-7 w-[46px] items-center justify-center rounded-[5px] bg-[#1D3353] py-1.5 max-sm:mr-4"
                      to={betHistoryItem.inviteLink}
                    >
                      <img src={linkIcon} />
                    </Link>
                  ) : (
                    <span className="max-sm:hidden"> Inactive</span>
                  )}
                </div>
                <div className="flex items-center font-bold">
                  $
                  {betHistoryItem.totalBet.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div
                  className={`flex items-center justify-end gap-1.5 font-extrabold ${betHistoryItem.totalWon - betHistoryItem.totalBet > 0 ? 'text-[#4EC87D]' : 'text-[#465B7C]'}`}
                >
                  $
                  {betHistoryItem.totalWon.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))
          ) : (
            <EmptyList text="NO BETS PLACED YET" />
          )}
        </div>
        {!!betHistory?.data?.length && (
          <div className="mb-8 flex items-center justify-center gap-3">
            <GenericButton
              skin="secondaryDark"
              onClick={() => setPage((p) => (p <= betHistory.totalPages ? p - 1 : p))}
              isDisabled={page <= 1}
              className="min-h-12 min-w-[60px] text-[#6E88AF] disabled:opacity-[24%]"
              text="Prev"
            ></GenericButton>
            <div className="flex min-w-[108px] items-center justify-center rounded-[5px] border border-[#253C60] py-4 font-bold disabled:cursor-default disabled:opacity-[24%]">
              {betHistory.page}/{betHistory.totalPages} Pages
            </div>
            <GenericButton
              skin="secondaryDark"
              onClick={() => setPage((p) => (p < betHistory.totalPages ? p + 1 : p))}
              isDisabled={betHistory.page >= betHistory.totalPages}
              className="min-h-12 min-w-[60px] text-[#6E88AF] disabled:opacity-[24%]"
              text="Next"
            ></GenericButton>
          </div>
        )}
      </div>
    </div>
  );
};
