import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import fairnessCheckmarkIcon from '../../../../assets/icons/common/checkmark-circle.svg';
import clearIcon from '../../../../assets/icons/common/clear-icon.svg';
import rebetIcon from '../../../../assets/icons/common/loop-icon.svg';
import undoIcon from '../../../../assets/icons/common/undo-icon.svg';
import { sockets } from '../../../../lib/interaction/sockets';
import { classNames } from '../../../../lib/utils';
import { useLobby } from '../../../../providers/lobby/context';
import { useMedia } from '../../../../providers/media/context';
import { ModalContext } from '../../../../providers/modal/context';
import { resourceManager } from '../../../../providers/resource-manager';
import { useRoulette } from '../../../../providers/roulette/context';
import { useCredentials } from '../../../../queries/auth';
import {
  RouletteGameStatus,
  useCurrentGame,
  useUserRouletteBets,
  useLobbyAggregatedBets,
} from '../../../../queries/roulette';
import { GenericButton } from '../../../common/buttons';
import { InfoTooltip } from '../../../common/info-tooltip';
import { ProgressBar } from '../../../common/progress-bar/progress-bar';
import { notify } from '../../../toast';
import { chipMap } from '../../lobby-table-seats';
import { SocketLockContext } from '../../../../providers/socket-locks/context';

export const RoulettePlaceYourBetsView = () => {
  const { selectedChipAmount, rouletteGameStatus, handleChangeSelectedChipAmount, currentLobbyId } = useRoulette();
  const { lobby } = useLobby();
  const { data: credentials } = useCredentials();
  const { data: currentGame } = useCurrentGame(currentLobbyId);
  const { data: userBets } = useUserRouletteBets(credentials?.user, currentLobbyId);
  const { data: aggregatedBets } = useLobbyAggregatedBets(currentLobbyId);
  const [currentRollNow, setCurrentRollNow] = useState(0);
  const { isMuted } = useMedia();
  const { openModal } = use(ModalContext);
  const [timer, setTimer] = useState<number | null>(null);
  const timerDeadlineRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { isLocked, setLock } = use(SocketLockContext);

  const distinctUsers = useMemo(() => [...new Set(aggregatedBets?.map((bet) => bet.userId) ?? [])], [aggregatedBets]);
  const distinctUserCount = useMemo(() => distinctUsers?.length, [distinctUsers?.length]);

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

      sockets.emit(`roulette:bet:${betPlace}`, {
        lobbyId: currentLobbyId,
        amount: selectedChipAmount,
        betPlace,
      });

      sockets.once('roulette:bet:error', (err: Error) => {
        notify('error', { title: 'Error', content: err.message || 'Bet failed' });
      });
    },
    [credentials?.user, currentGame?.lobby?.ownerId, currentLobbyId, selectedChipAmount],
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

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        timerDeadlineRef.current = null;
      }
    };
  }, []);

  const handleOpenRouletteHistoryModal = useCallback(() => {
    if (!lobby) return;

    openModal({
      key: 'roulette-fairness-history-modal',
      props: { lobbyId: lobby?.id },
      closable: true,
      lightBlur: true,
    });
  }, [lobby, openModal]);

  const isGreaterThanMinBet = useCallback((): boolean => {
    if (!lobby) return false;

    if (!userBets || userBets.length <= 0) return false;

    const currentPlayerBetsAmount = userBets.reduce((sum, bet) => sum + bet.amount, 0);

    if (currentPlayerBetsAmount < lobby?.rouletteMinBet) return false;

    return true;
  }, [userBets, lobby]);

  return (
    <div className="absolute top-0 flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[rgba(25,52,94,0.25)] to-[rgba(23,48,83,1)]">
      <InfoTooltip
        className="absolute top-3 right-15"
        tooltipClass="right-0 top-[130%] min-w-[250px] min-h-fitt"
        content={
          <div className="flex flex-col gap-2">
            <div>
              The goal of roulette is to predict where the ball will land on a spinning wheel with numbered red, black,
              and green pockets. Players can bet on individual numbers, colors, or groups of numbers to increase their
              chances of winning. After bets are placed, the wheel is spun, and payouts are based on the accuracy of
              their predictions.
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
        className="absolute top-1.5 right-5 z-20 mt-1 w-[20px] cursor-pointer"
      >
        <img src={fairnessCheckmarkIcon} />
      </div>

      <div className="mb-[17px] min-h-1">
        {!!timer && rouletteGameStatus === RouletteGameStatus.COUNTDOWN && <ProgressBar timeLeft={timer} />}
      </div>
      {credentials?.user && currentGame?.lobby?.ownerId !== credentials?.user && (
        <>
          <span className="mb-9 text-2xl font-bold tracking-widest">PLACE YOUR BETS</span>
          <div className="flex gap-5">
            {[0.5, 1, 5, 10, 25, 50, 100].map((amount) => (
              <button
                key={`roulette-bet-${amount}`}
                onClick={() => handleChangeSelectedChipAmount(amount)}
                className={classNames(
                  'pt-0.5 transition-all duration-100',
                  'roulette-chip',
                  selectedChipAmount === amount ? 'shadow-[0_0_10px_1.25px_#4EC87D] ring-1 ring-[#4EC87D]' : '',
                )}
              >
                <div className="relative flex h-20 w-20 items-center justify-center">
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
                      'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-extrabold drop-shadow-sm',
                      amount === 0.5 ? 'text-[#2B272A]' : 'text-white',
                    )}
                  >
                    ${amount}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-11 mb-6 flex gap-2">
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
          {userBets && userBets.length > 0 && currentGame?.status === RouletteGameStatus.COUNTDOWN && (
            <div className="absolute bottom-3">
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
                  userBets && userBets.length > 0 ? 'visible' : 'invisible',
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
        </>
      )}
    </div>
  );
};
