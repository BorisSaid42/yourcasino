import { useCallback } from 'react';
import { BreakpointEnum, classNames, useBreakpoint } from '../../lib/utils';
import { useLobby } from '../../providers/lobby/context';
import { useCredentials } from '../../queries/auth';
import { BlackjackGameStatus, useCurrentGame } from '../../queries/blackjack';
import { BlackjackSeatMobile } from './blackjack-mobile/blackjack-seat-mobile';
import { BlackjackPayoutResult } from './blackjack-payout-result';

export const BlackJackSeatsMobile = () => {
  const { lobby } = useLobby();
  const seatCount = 5;

  const { data: currentGame } = useCurrentGame(lobby?.id);
  const { data: credentials } = useCredentials();
  const isSmallerScreen = useBreakpoint(BreakpointEnum.XXS);

  const seats = Array.from({ length: seatCount });

  const isGreaterThanMinBet = useCallback((): boolean => {
    const player = currentGame?.players?.find((player) => player.userId === credentials?.user);
    if (!player) return false;

    const currentPlayerBetsAmount = player.bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (lobby && currentPlayerBetsAmount < lobby?.minBet) return false;

    return true;
  }, [credentials?.user, currentGame?.players, lobby]);

  return (
    <div className="absolute inset-0 h-full">
      {seats.map((_, i) => (
        <BlackjackSeatMobile i={i} key={`blackjack-mobile-seat-${i}`} />
      ))}
      {currentGame?.players?.some((player) => player.userId === credentials?.user) &&
        isGreaterThanMinBet() &&
        [
          BlackjackGameStatus.RESOLVING_USER_PAYOUTS,
          BlackjackGameStatus.RESOLVING_BETS,
          BlackjackGameStatus.FINISHED,
        ].includes(currentGame?.status) && (
          <div
            className={classNames(
              'absolute top-[50%] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4',
              isSmallerScreen ? 'max-sm:top-[200%]' : '',
            )}
          >
            <BlackjackPayoutResult currentGame={currentGame} currentUser={credentials?.user} />
          </div>
        )}
    </div>
  );
};
