import { useCallback } from 'react';
import { BlackjackGameStatus, Player, useCurrentGame } from '../../../queries/blackjack';
import { classNames, getBaseChip } from '../../../lib/utils';
import { chipMap } from '../lobby-table-seats';
import { useLobby } from '../../../providers/lobby/context';

export const BlackjackMainBetAmount = ({ seat }: { seat: Player }) => {
  const { lobby } = useLobby();
  const { data: currentGame } = useCurrentGame(lobby?.id);

  const isPlayerBlackjack = useCallback(
    (player: Player): boolean => {
      if (player.hands.length > 1) return false;

      const hasBlackjack = player.hands[0]?.handTotal === 21 && player.hands[0]?.hand?.length === 2;

      const potentialDealerBlackjack =
        (currentGame?.dealerHandTotal === 10 || currentGame?.dealerHandTotal === 11) &&
        currentGame?.dealerHand?.length === 1;

      if (hasBlackjack && !potentialDealerBlackjack) return true;

      return false;
    },
    [currentGame?.dealerHand?.length, currentGame?.dealerHandTotal],
  );

  if (!currentGame) return;

  const totalAmount = seat.bets
    .filter((bet) => bet.betPlace === 'main')
    .reduce(
      (sum, bet) =>
        sum +
        ([
          BlackjackGameStatus.RESOLVING_USER_PAYOUTS,
          BlackjackGameStatus.RESOLVING_BETS,
          BlackjackGameStatus.FINISHED,
        ].includes(currentGame?.status) || isPlayerBlackjack(seat)
          ? bet.wonAmount
          : bet.amount),
      0,
    );

  if (!totalAmount) return;

  const baseChip = getBaseChip(totalAmount);
  const chipSrc = chipMap[baseChip];

  return (
    <div className="absolute top-0 left-0 z-[100]">
      <div className="relative">
        <img
          style={{ transform: 'scale(1.325) translate(-12.25%, -12.25%)', transformOrigin: 'top left' }}
          src={chipSrc}
          alt={`Bet ${totalAmount}`}
        />
        <span
          className={classNames(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold whitespace-nowrap drop-shadow-sm select-none',
            baseChip === 0.5 ? 'text-black' : 'text-white',
            String(totalAmount).length >= 4 ? 'text-[12px]' : 'text-base',
          )}
        >
          ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};
