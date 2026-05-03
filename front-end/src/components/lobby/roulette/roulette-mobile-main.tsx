import { memo, use, useCallback, useEffect, useRef, useState } from 'react';
import clearIcon from '../../../assets/icons/common/clear-icon.svg';
import rebetIcon from '../../../assets/icons/common/loop-icon.svg';
import undoIcon from '../../../assets/icons/common/undo-icon.svg';
import fairnessCheckmarkIcon from '../../../assets/icons/common/checkmark-circle.svg';
import { sockets } from '../../../lib/interaction/sockets';
import { classNames } from '../../../lib/utils';
import { useRoulette } from '../../../providers/roulette/context';
import { useCredentials } from '../../../queries/auth';
import {
  RouletteGameStatus,
  useCurrentGame,
  useUserRouletteBets,
  useLobbyAggregatedBets,
} from '../../../queries/roulette';
import { ProgressBar } from '../../common/progress-bar/progress-bar';
import { notify } from '../../toast';
import { chipMap } from '../lobby-table-seats';
import { RouletteMobileBoardUI } from './roulette-mobile-components/roulette-mobile-board-ui';
import { RouletteMobileClickableGrid } from './roulette-mobile-components/roulette-mobile-clickable-grid';
import { RoulettePlayingView } from './roullete-main-view/roulette-playing-view';
import { resourceManager } from '../../../providers/resource-manager';
import { InfoTooltip } from '../../common/info-tooltip';
import { useMedia } from '../../../providers/media/context';
import { ModalContext } from '../../../providers/modal/context';
import { useLobby } from '../../../providers/lobby/context';
import { GenericButton } from '../../common/buttons';
import { SocketLockContext } from '../../../providers/socket-locks/context';

export const RouletteMobileMain = memo(() => {
  const [timer, setTimer] = useState<number | null>(null);
  const timerDeadlineRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { selectedChipAmount, handleChangeSelectedChipAmount, currentLobbyId, rouletteGameStatus } = useRoulette();
  const { data: credentials } = useCredentials();
  const { data: userBets } = useUserRouletteBets(credentials?.user, currentLobbyId);
  const { data: currentGame } = useCurrentGame(currentLobbyId);
  const { data: aggregatedBets } = useLobbyAggregatedBets(currentLobbyId);
  const [currentRollNow, setCurrentRollNow] = useState(0);
  const { isMuted } = useMedia();
  const { lobby } = useLobby();
  const { openModal } = use(ModalContext);
  const { isLocked, setLock } = use(SocketLockContext);

  const distinctUsers = [...new Set(aggregatedBets?.map((bet) => bet.userId) ?? [])];
  const distinctUserCount = distinctUsers?.length;

  const startTimer = useCallback((deadline: string) => {
    const deadlineTime = new Date(deadline).getTime();
    const now = Date.now();
    const remaining = Math.max(0, (deadlineTime - now) / 1000);

    if (timerDeadlineRef.current === deadlineTime && timerIntervalRef.current) {
      return;
    }

    timerDeadlineRef.current = deadlineTime;
    setTimer(remaining);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, (timerDeadlineRef.current! - now) / 1000);
      setTimer(remaining);

      if (remaining <= 0 && timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        timerDeadlineRef.current = null;
      }
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    timerDeadlineRef.current = null;
    setTimer(null);
  }, []);

  const handlePlaceBet = useCallback(
    (betPlace: string) => {
      if (currentGame?.lobby?.ownerId === credentials?.user) {
        return;
      }

      if (selectedChipAmount === null) {
        notify('warning', { title: 'Warning', content: 'Select the bet amount first.' });
        return;
      }

      if (betPlace === 'rollnow') {
        resourceManager.playAudio('deal-now', { volume: isMuted ? 0 : 100, clone: true });
      }

      sockets.emit(`roulette:bet:${betPlace}`, {
        lobbyId: currentLobbyId,
        amount: selectedChipAmount,
        betPlace,
      });

      sockets.once('roulette:bet:error', (err: Error) => {
        notify('error', { title: 'Error', content: err.message || 'Bet failed' });
      });
    },
    [credentials?.user, currentGame?.lobby?.ownerId, currentLobbyId, isMuted, selectedChipAmount],
  );

  useEffect(() => {
    const onCountdown = ({ seconds, deadline }: { seconds: number; deadline?: string }) => {
      if (deadline) {
        startTimer(deadline);
      } else {
        setTimer(seconds);
      }
      setCurrentRollNow(0);
      setLock('roulette-rollnow', false);
    };

    sockets.on('roulette:game:countdown', onCountdown);
    return () => {
      sockets.off('roulette:game:countdown', onCountdown);
    };
  }, [setLock, startTimer]);

  useEffect(() => {
    const onRollNowCount = ({ rollNowCount }: { rollNowCount: number }) => {
      setCurrentRollNow(rollNowCount ?? 0);
    };

    sockets.on('roulette:game:rollnow', onRollNowCount);
    return () => {
      sockets.off('roulette:game:rollnow', onRollNowCount);
    };
  }, []);

  useEffect(() => {
    if (!currentGame || !lobby) return;

    if (
      currentGame.timerDeadline &&
      currentGame.timerType === 'countdown' &&
      currentGame.status === RouletteGameStatus.COUNTDOWN
    ) {
      const deadlineTime = new Date(currentGame.timerDeadline).getTime();
      const now = Date.now();
      const remaining = Math.max(0, (deadlineTime - now) / 1000);

      if (remaining > 0 && !timerIntervalRef.current) {
        startTimer(currentGame.timerDeadline.toString());
      }
    } else if (currentGame.status !== RouletteGameStatus.COUNTDOWN && timerIntervalRef.current) {
      stopTimer();
    }
  }, [currentGame, lobby, startTimer, stopTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null; // Clear the ref!
        timerDeadlineRef.current = null; // Clear the deadline ref too!
      }
    };
  }, []);

  const handleOpenRouletteHistoryModal = () => {
    if (!lobby) return;

    openModal({
      key: 'roulette-fairness-history-modal',
      props: { lobbyId: lobby?.id },
      closable: true,
      lightBlur: true,
    });
  };

  const isGreaterThanMinBet = (): boolean => {
    if (!lobby) return false;

    const userBets = currentGame?.bets?.filter((bet) => bet.userId === credentials?.user);
    if (!userBets || userBets.length <= 0) return false;

    const currentPlayerBetsAmount = userBets.reduce((sum, bet) => sum + bet.amount, 0);

    if (currentPlayerBetsAmount < lobby?.rouletteMinBet) return false;

    return true;
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Place bets mobile view */}
      <div
        className={classNames(
          `flex flex-col duration-200`,
          rouletteGameStatus === RouletteGameStatus.PLAYING || rouletteGameStatus === RouletteGameStatus.FINISHED
            ? 'opacity-[20%]'
            : '',
        )}
      >
        {credentials?.user && currentGame?.lobby?.ownerId !== credentials?.user && (
          <span className="mb-4 flex items-center text-sm font-bold tracking-widest">PLACE YOUR BETS</span>
        )}
        <InfoTooltip
          className="absolute right-15 bottom-[unset] z-20 mt-1"
          tooltipClass="min-w-[250px] min-h-fitt right-0 left-[unset] top-5"
          content={
            <div className="flex flex-col gap-2">
              <div>
                The goal of roulette is to predict where the ball will land on a spinning wheel with numbered red,
                black, and green pockets. Players can bet on individual numbers, colors, or groups of numbers to
                increase their chances of winning. After bets are placed, the wheel is spun, and payouts are based on
                the accuracy of their predictions.
              </div>
              <div>
                Payouts:
                <ul>
                  <li>- Color pays 1:1</li>
                  <li>- Even/Odd pays 1:1</li>
                  <li>- Low/High pays 1:1</li>
                  <li>- 12th pays 2:1</li>
                  <li>- Column pays 2:1 </li>
                  <li>- Number pays 36:1</li>
                </ul>
              </div>
            </div>
          }
        />

        <div
          onClick={handleOpenRouletteHistoryModal}
          className="absolute right-5 bottom-[unset] z-20 mt-0.5 w-[20px] cursor-pointer"
        >
          <img src={fairnessCheckmarkIcon} />
        </div>

        <div className={`min-h-1`}>
          {!!timer && rouletteGameStatus === RouletteGameStatus.COUNTDOWN && <ProgressBar timeLeft={timer} />}
        </div>
      </div>
      <div className="relative mt-6 flex">
        {/* CHIPS */}
        {credentials?.user && currentGame?.lobby?.ownerId !== credentials?.user && (
          <div
            className={`mx-2.5 flex flex-col items-center gap-2 duration-200 ${rouletteGameStatus === RouletteGameStatus.PLAYING || rouletteGameStatus === RouletteGameStatus.FINISHED ? 'opacity-[20%]' : ''}`}
          >
            {[0.5, 1, 5, 10, 25, 50, 100].map((amount) => (
              <button
                key={`roulette-bet-${amount}`}
                onClick={() => {
                  handleChangeSelectedChipAmount(amount);
                }}
                className={classNames(
                  'cursor-pointer rounded-full pt-0.5 transition-all duration-100',
                  'roulette-chip',
                  selectedChipAmount === amount ? 'shadow-[0_0_10px_1.25px_#4EC87D] ring-1 ring-[#4EC87D]' : '',
                )}
              >
                <div className="relative flex aspect-square w-10 items-center justify-center">
                  <img
                    src={chipMap[amount]}
                    alt={`Chip ${amount}`}
                    className={classNames(
                      'aspect-square transition-transform duration-100',
                      selectedChipAmount === amount ? 'scale-90' : 'scale-100',
                    )}
                  />
                  <span
                    className={classNames(
                      'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-extrabold drop-shadow-sm',
                      amount === 0.5 ? 'text-[#2B272A]' : 'text-white',
                    )}
                  >
                    ${amount}
                  </span>
                </div>
              </button>
            ))}
            <div className="mt-4 mb-6 flex flex-col gap-2">
              <GenericButton
                onClick={() => handlePlaceBet('rebet')}
                text="REBET"
                skin="betControl"
                leftIcon={<img src={rebetIcon} />}
              />
              <GenericButton
                onClick={() => handlePlaceBet('undo')}
                text="UNDO"
                skin="betControl"
                leftIcon={<img src={undoIcon} />}
              />
              <GenericButton onClick={() => handlePlaceBet('x2')} text=" X2 BET" skin="betControl" />
              <GenericButton
                onClick={() => handlePlaceBet('clear')}
                text="CLEAR"
                skin="betControl"
                leftIcon={<img src={clearIcon} />}
              />
            </div>
          </div>
        )}
        <div
          className={`relative mx-auto duration-200 ${rouletteGameStatus === RouletteGameStatus.PLAYING || rouletteGameStatus === RouletteGameStatus.FINISHED ? 'opacity-[20%]' : ''}`}
        >
          <RouletteMobileBoardUI />
          {credentials?.user && currentGame?.lobby?.ownerId !== credentials?.user && <RouletteMobileClickableGrid />}
        </div>
        {(rouletteGameStatus === RouletteGameStatus.PLAYING || rouletteGameStatus === RouletteGameStatus.FINISHED) && (
          <>
            <div className="absolute h-full max-h-[350px] w-full overflow-hidden">
              <RoulettePlayingView currentGame={currentGame} />
            </div>
          </>
        )}
        {userBets && userBets.length > 0 && currentGame?.status === RouletteGameStatus.COUNTDOWN && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
            <div
              onClick={() => {
                if (isLocked('roulette-rollnow') || !isGreaterThanMinBet() || !timer || timer >= 6) {
                  return;
                }
                setLock('roulette-rollnow', true);
                resourceManager.playAudio('deal-now', { volume: isMuted ? 0 : 100, clone: true });
                handlePlaceBet('rollnow');
              }}
              className={classNames(
                'deal-now top-[550px] flex items-center gap-2 px-2.5 py-4 text-[13px] font-bold text-[#FFB367] uppercase',
                userBets && userBets.length > 0 && rouletteGameStatus === RouletteGameStatus.COUNTDOWN
                  ? 'visible'
                  : 'invisible',
                isGreaterThanMinBet() && !isLocked('roulette-rollnow') && timer && timer < 6
                  ? 'cursor-pointer hover:scale-105 hover:border-2 hover:border-yellow-400'
                  : 'cursor-not-allowed opacity-50',
              )}
            >
              Roll Now
              {currentGame && distinctUserCount > 1 && (
                <span className="text-white">
                  ({currentRollNow}/{distinctUserCount})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
