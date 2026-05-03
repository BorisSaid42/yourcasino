import { useEffect, useState } from 'react';
import { BreakpointEnum, classNames, useBreakpoint } from '../../lib/utils';
import { useMedia } from '../../providers/media/context';
import { resourceManager } from '../../providers/resource-manager';
import { BlackjackGame, Player } from '../../queries/blackjack';

type PayoutResultProps = {
  currentGame: BlackjackGame;
  currentUser: string;
};

export const BlackjackPayoutResult = ({ currentGame, currentUser }: PayoutResultProps) => {
  const [playerPayout, setPlayerPayout] = useState<number>(0);
  const [wonAmount, setWonAmount] = useState<number>(0);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [shouldShowGameResult, setShouldShowGameResult] = useState(false);
  const [gameOutcome, setGameOutcome] = useState<'win' | 'loss' | 'push' | null>(null);

  const isXXSScreen = useBreakpoint(BreakpointEnum.XXS);
  const { isMuted } = useMedia();

  useEffect(() => {
    const player = currentGame?.players?.find((player) => player.userId === currentUser);

    if (!player || !currentUser) {
      setShouldShowGameResult(false);
      return;
    }

    setCurrentPlayer(player);

    if (player.hands.length === 0) return;

    const playerMainBets = player.bets.filter((bet) => bet.betPlace === 'main');
    const playerMainBetsWon = playerMainBets.reduce((sum, bet) => sum + bet.wonAmount, 0);
    const mainBetAmount = playerMainBets.reduce((sum, bet) => sum + bet.amount, 0);
    const wonAmount = player.bets.reduce((sum, bet) => sum + bet.wonAmount, 0);

    const dealerTotal = currentGame.dealerHandTotal;

    let wins = 0;
    let losses = 0;

    player.hands.forEach((playerHand) => {
      const playerTotal = playerHand.handTotal;
      const playerHasBj = playerTotal === 21 && playerHand.hand.length === 2;

      if (playerHasBj && dealerTotal === 21 && currentGame.dealerHand.length !== 2) {
        wins++;
      } else if (playerHasBj && dealerTotal === 21 && currentGame.dealerHand.length === 2 && player.insured) {
        wins++;
      } else if (playerTotal === dealerTotal) {
        // do nothing (PUSH)
      } else if ((playerTotal > dealerTotal || dealerTotal > 21) && playerTotal <= 21) {
        wins++;
      } else {
        losses++;
      }
    });

    if (wins > losses) {
      setGameOutcome('win');
    } else if (losses > wins) {
      setGameOutcome('loss');
    } else if (wins === losses) {
      setGameOutcome('push');
    } else {
      setGameOutcome(playerMainBetsWon > mainBetAmount ? 'win' : 'loss');
    }

    setTimeout(() => {
      setWonAmount(wonAmount);
      setPlayerPayout(playerMainBetsWon - mainBetAmount);
      setShouldShowGameResult(true);
    }, currentGame?.dealerHand?.length * 500);
  }, [currentGame, currentUser]);

  useEffect(() => {
    if (playerPayout > 0) {
      resourceManager.playAudio('win-sound', { volume: isMuted ? 0 : 100, clone: true });
    }
  }, [isMuted, playerPayout]);

  return (
    <>
      {currentPlayer && currentUser && shouldShowGameResult && (
        <div
          className={classNames(
            'flex w-full flex-col items-center justify-center px-[65px] py-2.5 text-[28px] font-bold text-white uppercase select-none max-sm:px-[35px]',
            gameOutcome === 'win' && 'user-won',
            gameOutcome === 'loss' && 'user-lost',
            gameOutcome === 'push' && 'user-push',
          )}
        >
          <span
            className={classNames(
              'text-base font-black tracking-[15%]',
              isXXSScreen ? 'max-sm:text-sm' : '',
              gameOutcome === 'win' && 'text-[#4EC87D]',
              gameOutcome === 'loss' && 'text-[20px] text-[#FF3C48]',
              gameOutcome === 'push' && 'text-[20px] text-white',
            )}
          >
            {gameOutcome === 'win' && 'You won'}
            {gameOutcome === 'loss' && 'You lose'}
            {gameOutcome === 'push' && 'PUSH'}
          </span>

          {gameOutcome === 'win' && wonAmount > 0 && (
            <span className="text-[28px] font-bold text-white">
              $
              {wonAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </div>
      )}
    </>
  );
};
