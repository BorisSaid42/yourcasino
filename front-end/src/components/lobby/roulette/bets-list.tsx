import profileIcon from '../../../assets/icons/profile-icon.svg';
import { classNames } from '../../../lib/utils';
import { useRoulette } from '../../../providers/roulette/context';
import { useLobbyAggregatedBets } from '../../../queries/roulette';
import { findColorResult } from './utils';
import emptyListIcon from '../../../assets/icons/lobby/empty-list-background.svg';
import { useCallback } from 'react';

export const BetsList = () => {
  const { currentLobbyId } = useRoulette();
  const { data: aggregatedBets = [] } = useLobbyAggregatedBets(currentLobbyId);

  const formatBetPlace = useCallback((betPlace: string) => {
    if (betPlace.includes('_')) {
      return betPlace.split('_').join(' ');
    }

    return betPlace;
  }, []);

  return (
    <div className="mt-[22px] flex w-full max-w-[288px] flex-col gap-3 max-xl:max-w-[230px] max-md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <img src={profileIcon} width={14} alt="profile icon" />
          <div className="flex items-center">
            {aggregatedBets.length} Bet{aggregatedBets.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="flex items-center text-base font-bold">
          {aggregatedBets.length <= 0 ? '$0' : ''}
          {aggregatedBets.length === 1 ? `$${aggregatedBets[0].amount}` : ''}
          {aggregatedBets.length > 1
            ? `$${Math.min(...aggregatedBets.map((bet) => bet.amount))} - $${Math.max(...aggregatedBets.map((bet) => bet.amount))}`
            : ''}
        </div>
      </div>
      {aggregatedBets.length > 0 ? (
        <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-[#152947] scrollbar-track-[#6E88AF60] flex max-h-[77vh] w-full flex-col gap-2 overflow-auto pr-1">
          {aggregatedBets.map((bet, idx) => (
            <div
              key={`bet-item-${bet.userId}-${bet.betPlace}-${idx}`}
              className="flex justify-between rounded-[5px] bg-[#192B48] px-3 py-2.5"
            >
              <div className="text-[13px] font-extrabold">{bet.username}</div>
              <div className="flex items-center gap-2 font-extrabold">
                <div
                  className={classNames(
                    'flex min-h-[16px] min-w-[24px] items-center justify-center rounded-[5px] bg-[#727272] px-1 py-[1px] text-xs',
                    {
                      'bg-[#364E71]': findColorResult(bet.betPlace) === 'black',
                      'bg-[#FF3C48]': findColorResult(bet.betPlace) === 'red',
                      'bg-[#727272]': findColorResult(bet.betPlace) === 'gray',
                      'bg-[#328C3C]': findColorResult(bet.betPlace) === 'green',
                    },
                  )}
                >
                  {formatBetPlace(bet.betPlace)}
                </div>
                <div className="text-[13px]">
                  $
                  {bet.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[248px] flex-col items-center justify-center gap-4">
          <img width={36} src={emptyListIcon} alt="empty list icon" />
          <div className="text-base font-extrabold text-[#465B7C]">No roulette bets</div>
        </div>
      )}
    </div>
  );
};
