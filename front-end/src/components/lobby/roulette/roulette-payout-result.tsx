import { useEffect, useState } from 'react';
import { RouletteGame } from '../../../queries/roulette';
import { BreakpointEnum, classNames, useBreakpoint } from '../../../lib/utils';
import { resourceManager } from '../../../providers/resource-manager';
import { useMedia } from '../../../providers/media/context';

type PayoutResultProps = {
  currentGame: RouletteGame;
  currentUser: string;
};

export const RoulettePayoutResult = ({ currentGame, currentUser }: PayoutResultProps) => {
  const [playerPayout, setPlayerPayout] = useState<number>(0);
  const [wonAmount, setWonAmount] = useState<number>(0);
  const isXXSScreen = useBreakpoint(BreakpointEnum.XXS);
  const { isMuted } = useMedia();

  useEffect(() => {
    const playerBets = currentGame?.bets?.filter((bet) => bet.userId === currentUser);

    const playerBetsAmount = playerBets.reduce((sum, bet) => sum + bet.amount, 0);
    const wonAmount = playerBets.reduce((sum, bet) => sum + bet.wonAmount, 0);

    setWonAmount(wonAmount);
    setPlayerPayout(wonAmount - playerBetsAmount);
  }, [currentGame, currentUser]);

  useEffect(() => {
    if (wonAmount > 0) {
      resourceManager.playAudio('win-sound', { volume: isMuted ? 0 : 100, clone: true });
    }
  }, [wonAmount, isMuted]);

  return (
    <>
      {wonAmount > 0 && (
        <div
          className={classNames(
            'flex w-full flex-col items-center justify-center px-[45px] py-1 text-[18px] font-bold text-white uppercase max-sm:px-[35px]',
            playerPayout > 0 && 'user-won',
            playerPayout === 0 && 'user-push',
          )}
        >
          <span
            className={classNames(
              'text-[10px] font-black tracking-[1.5px]',
              isXXSScreen ? 'max-sm:text-sm' : '',
              playerPayout > 0 && 'text-[#4EC87D]',
              playerPayout <= 0 && 'text-white',
            )}
          >
            {playerPayout > 0 && 'You won'}
            {playerPayout <= 0 && 'You won'}
          </span>

          <span className="text-[18px] font-bold tracking-[0] text-white">
            $
            {wonAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      )}
    </>
  );
};
