import { use, useCallback, useEffect, useRef, useState } from 'react';
import rhombus from '../../assets/icons/common/rhombus.svg';
import fairnessCheckmarkIcon from '../../assets/icons/common/checkmark-circle.svg';
import { useLobby } from '../../providers/lobby/context';
import { useCredentials } from '../../queries/auth';
import { useCurrentGame } from '../../queries/blackjack';
import { BlackjackLobbyControllsMobile } from './blackjack-lobby-controlls-mobile';
import { BlackJackNavMobile } from './blackjack-nav-mobile';
import { BlackJackSeatsMobile } from './blackjack-seats-mobile';
import { Card } from './card';
import { TableChips } from './lobby-chips';
import { InfoTooltip } from '../common/info-tooltip';
import { ModalContext } from '../../providers/modal/context';
import { sockets } from '../../lib/interaction/sockets';
import { useQueryClient } from '@tanstack/react-query';
import { SocketLockContext } from '../../providers/socket-locks/context';

export const BlackJackLobbyMobile = () => {
  const { lobby } = useLobby();
  const { data: currentGame } = useCurrentGame(lobby?.id);
  const { data: credentials } = useCredentials();
  const [dealerHandTotal, setDealerHandTotal] = useState(0);
  const { openModal } = use(ModalContext);
  const queryClient = useQueryClient();
  const { setLock } = use(SocketLockContext);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const timerDeadlineRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [askInsurance, setAskInsurance] = useState<boolean>(false);
  const [currentDealNow, setCurrentDealNow] = useState(0);

  const startTimer = useCallback((deadline: string) => {
    const deadlineTime = new Date(deadline).getTime();
    const now = Date.now();
    const remaining = Math.max(0, (deadlineTime - now) / 1000);

    timerDeadlineRef.current = deadlineTime;
    setTimeLeft(remaining);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, (timerDeadlineRef.current! - now) / 1000);
      setTimeLeft(remaining);

      if (remaining === 0 && timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    timerDeadlineRef.current = null;
    setTimeLeft(10);
  }, []);

  useEffect(() => {
    if (!currentGame?.dealerHandTotal) {
      setDealerHandTotal(0);
      return;
    }

    const timeoutDuration = 1200;

    const timeout = setTimeout(() => {
      setDealerHandTotal(currentGame?.dealerHandTotal);
    }, timeoutDuration);

    return () => clearTimeout(timeout);
  }, [currentGame?.dealerHand?.length, currentGame?.dealerHandTotal]);

  useEffect(() => {
    if (!lobby) return;

    const onDealNowCount = ({ dealNowCount }: { dealNowCount: number }) => {
      setCurrentDealNow(dealNowCount ?? 0);
    };

    sockets.on('blackjack:game:dealnow', onDealNowCount);
    return () => {
      sockets.off('blackjack:game:dealnow', onDealNowCount);
    };
  }, [lobby]);

  useEffect(() => {
    if (!lobby) return;

    const onTurnStart = ({ lobbyId, deadline }: { lobbyId: string; deadline?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['blackjack', 'game', 'current', lobbyId] });
      setAskInsurance(false);
      setCurrentDealNow(0);
      setLock('deal-now', false);

      if (deadline) {
        startTimer(deadline);
      }
    };

    const onInsuranceStart = ({ lobbyId, deadline }: { lobbyId: string; deadline?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['blackjack', 'game', 'current', lobbyId] });
      setAskInsurance(true);
      setCurrentDealNow(0);

      if (deadline) {
        startTimer(deadline);
      }
    };

    const onCountdown = ({ deadline }: { deadline?: string }) => {
      setAskInsurance(false);
      setCurrentDealNow(0);

      if (deadline) {
        startTimer(deadline);
      }
    };

    sockets.on('blackjack:turn:start', onTurnStart);
    sockets.on('blackjack:turn:insurance', onInsuranceStart);
    sockets.on('blackjack:game:countdown', onCountdown);

    return () => {
      sockets.off('blackjack:turn:start', onTurnStart);
      sockets.off('blackjack:turn:insurance', onInsuranceStart);
      sockets.off('blackjack:game:countdown', onCountdown);
    };
  }, [lobby, queryClient, setLock, startTimer]);

  useEffect(() => {
    if (!currentGame || !lobby) return;

    if (currentGame.timerDeadline && currentGame.timerType) {
      const deadlineTime = new Date(currentGame.timerDeadline).getTime();
      const now = Date.now();
      const remaining = Math.max(0, (deadlineTime - now) / 1000);

      if (remaining > 0) {
        startTimer(currentGame.timerDeadline.toString());
        setAskInsurance(currentGame.timerType === 'insurance');
      }
    } else {
      stopTimer();
      setAskInsurance(false);
    }
  }, [currentGame, lobby, startTimer, stopTimer]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleOpenBJHistoryModal = useCallback(() => {
    if (!lobby) return;

    openModal({
      key: 'blackjack-fairness-history-modal',
      props: { lobbyId: lobby?.id },
      closable: true,
      lightBlur: true,
    });
  }, [lobby, openModal]);

  return (
    <div className="w-full max-w-[1200px] px-3">
      <div>
        <BlackJackNavMobile />
        {/* TABLE */}
        <div className="relative mb-[170px] aspect-[2/1] w-full max-sm:mb-[110px]">
          <InfoTooltip
            className="absolute top-4 right-15 bottom-[unset] z-20"
            tooltipClass="min-w-[250px] min-h-fitt right-0 left-[unset] top-5"
            content={
              <div className="flex flex-col gap-2">
                <div>
                  The goal of Blackjack is to have a card total higher than the virtual dealer without going over 21.
                  The strongest hand is a Blackjack, which happens when the first two cards dealt add up to exactly 21.
                </div>
                <div>
                  Payouts:
                  <ul>
                    <li>- A Blackjack pays 3 to 2</li>
                    <li>- A regular winning hand pays 1 to 1</li>
                    <li>- Insurance pays 2 to 1</li>
                    <br />
                    <li>Side bets:</li>
                    <li>21+3:</li>
                    <li>- Flush 5:1</li>
                    <li>- Straight 10:1</li>
                    <li>- Three-of-a-kind 30:1</li>
                    <br />
                    <li>Perfect Pair:</li>
                    <li>- Pair: 5:1</li>
                    <li>- Colored Paid: 10:1</li>
                    <li>- Perfect Pair: 25:1</li>
                  </ul>
                </div>
              </div>
            }
          />
          <TableChips className="top-0 z-10 origin-top max-md:scale-50" />

          <div onClick={handleOpenBJHistoryModal} className="absolute top-2 right-5 z-20 mt-1 w-[20px] cursor-pointer">
            <img src={fairnessCheckmarkIcon} />
          </div>
          <div className="relative aspect-[2/1] w-full overflow-hidden">
            <div className="relative aspect-square w-full -translate-y-[55%] overflow-hidden rounded-b-[45%] bg-[linear-gradient(180deg,_#112B55_0%,_#0E2547_100%)]">
              <div className="absolute inset-[4px] rounded-[45%] bg-[linear-gradient(180deg,_#19345E_0%,_#173053_100%)]"></div>
              {/* TABLE BG */}
              <div className="absolute bottom-[25%] left-[50%] flex max-w-[80%] -translate-x-[50%] translate-y-[50%] flex-col items-center">
                <div className="flex h-[44px] w-[362px] items-center justify-center bg-[url('/src/assets/game-header-bg.png')] bg-contain bg-center bg-no-repeat text-[20px] font-bold text-[#1C3A66] max-sm:bg-[length:50%] max-sm:text-[10px]">
                  BLACKJACK PAYS 3 TO 2
                </div>
                <div className="pt-4 text-center text-[16px] font-bold text-[#102A51] max-sm:pt-0 max-sm:text-[8px]">
                  DEALER MUST STAND ON 17 AND DRAW ON 16
                </div>
                {lobby?.sideBets && (
                  <div className="flex gap-4 pt-6 text-[16px] font-bold text-[#102A51] max-sm:pt-0 max-sm:text-[8px]">
                    2 TO 1<img src={rhombus} className="max-sm:max-w-2.5" />
                    INSURANCE PAYS
                    <img src={rhombus} className="max-sm:max-w-2.5" />2 TO 1
                  </div>
                )}
              </div>
              {/* CARDS IN THE CENTER */}
              <div className="absolute bottom-[30%] left-1/2 flex min-w-[20px] translate-x-[-150%] translate-y-1/2 items-center max-lg:scale-75 max-sm:scale-[0.40]">
                {currentGame?.dealerHand?.map((card, i) => (
                  <Card
                    key={`dealer-card-${i}`}
                    value={card}
                    fromX={i === 1 ? 35 : undefined}
                    fromY={i === 1 ? 15 : undefined}
                    faceDown={!card}
                    toX={35 * i + 1}
                    toY={15 * i}
                    initialOpacity={i === 1 ? 1 : 0}
                  />
                ))}

                {currentGame?.dealerHand?.length === 1 &&
                  currentGame?.players?.every(
                    (player) => player.hands[0]?.hand?.length >= 2 || player.hands[0]?.hasSplitted,
                  ) && <Card faceDown toX={35} toY={15} delay={1} />}

                {currentGame?.dealerHand && currentGame?.dealerHand?.length > 0 && (
                  <div className="absolute bottom-[-75px] left-[35px] z-50 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[5px] border border-[#253C60] bg-[#08152A] text-[16px] font-bold max-sm:bottom-[-70px] max-sm:scale-170">
                    {dealerHandTotal}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* SEATS WRAPPER */}
          <BlackJackSeatsMobile />
        </div>
        {/* CONTROLS */}
        {currentGame?.players?.some((player) => player.userId === credentials?.user) ? (
          <BlackjackLobbyControllsMobile
            currentGame={currentGame}
            timeLeft={timeLeft}
            askInsurance={askInsurance}
            currentDealNow={currentDealNow}
          />
        ) : null}
      </div>
    </div>
  );
};
