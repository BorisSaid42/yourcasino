import { classNames, getBaseChip } from '../../../lib/utils';
import { useLobby } from '../../../providers/lobby/context';
import { BlackjackGameStatus, Player, useCurrentGame } from '../../../queries/blackjack';
import { chipMap } from '../lobby-table-seats';

export const BlackjackPerfectPairBetAmount = ({ seat }: { seat: Player }) => {
  const { lobby } = useLobby();
  const { data: currentGame } = useCurrentGame(lobby?.id);

  const totalAmount = seat.bets
    .filter((bet) => bet.betPlace === 'perfect_pair')
    .reduce(
      (sum, bet) =>
        sum +
        (currentGame?.status !== BlackjackGameStatus.WAITING_BETS &&
        currentGame?.status !== BlackjackGameStatus.COUNTDOWN &&
        ((seat.hands.length >= 1 && seat.hands[0].hand.length >= 2) ||
          (seat.hands.length > 1 && seat.hands[0].hasSplitted))
          ? bet.wonAmount
          : bet.amount),
      0,
    );

  if (!totalAmount) return;

  const baseChip = getBaseChip(totalAmount);
  const chipSrc = chipMap[baseChip];

  return (
    <div className="absolute top-0 left-0 z-[100]">
      <div className="relative scale-[1.5]">
        <img className="scale-[0.6]" src={chipSrc} alt={`Bet ${totalAmount}`} />
        <span
          className={classNames(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold whitespace-nowrap drop-shadow-sm select-none',
            baseChip === 0.5 ? 'text-black' : 'text-white',
            String(totalAmount).length >= 4 ? 'text-[6px]' : 'text-[8px]',
          )}
        >
          $
          {totalAmount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
};
