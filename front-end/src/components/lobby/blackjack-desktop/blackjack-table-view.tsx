import { use, useCallback, useEffect, useState } from 'react';
import fairnessCheckmarkIcon from '../../../assets/icons/common/checkmark-circle.svg';
import insuranceNoIcon from '../../../assets/icons/common/insurance-no.svg';
import insuranceYesIcon from '../../../assets/icons/common/insurance-yes.svg';
import rhombus from '../../../assets/icons/common/rhombus.svg';
import { sockets } from '../../../lib/interaction/sockets';
import { useLobby } from '../../../providers/lobby/context';
import { ModalContext } from '../../../providers/modal/context';
import { useCredentials } from '../../../queries/auth';
import { BlackjackGameStatus, useCurrentGame } from '../../../queries/blackjack';
import { InfoTooltip } from '../../common/info-tooltip';
import { BlackjackPayoutResult } from '../blackjack-payout-result';
import { Card } from '../card';
import { TableChips } from '../lobby-chips';
import { TableSeats } from '../lobby-table-seats';
import { BlackjackBetOptions } from './blackjack-bet-options';
import { SocketLockContext } from '../../../providers/socket-locks/context';
import { classNames } from '../../../lib/utils';

export const BlackjackTableView = ({ askInsurance, timeLeft }: { askInsurance: boolean; timeLeft: number }) => {
  const { lobby: currentLobby } = useLobby();
  const { openModal } = use(ModalContext);
  const { data: currentGame } = useCurrentGame(currentLobby?.id);
  const { data: credentials } = useCredentials();
  const [dealerHandTotal, setDealerHandTotal] = useState(0);
  const { isLocked, setLock } = use(SocketLockContext);

  const handleOpenBJHistoryModal = useCallback(() => {
    if (!currentLobby) return;

    openModal({
      key: 'blackjack-fairness-history-modal',
      props: { lobbyId: currentLobby?.id },
      closable: true,
      lightBlur: true,
    });
  }, [currentLobby, openModal]);

  useEffect(() => {
    if (!currentLobby || !currentGame?.dealerHandTotal) {
      setDealerHandTotal(0);
      return;
    }

    const timeoutDuration = 1000;

    const timeout = setTimeout(() => {
      setDealerHandTotal(currentGame?.dealerHandTotal);
    }, timeoutDuration);

    return () => clearTimeout(timeout);
  }, [currentGame?.dealerHand?.length, currentGame?.dealerHandTotal, currentLobby]);

  const isGreaterThanMinBet = useCallback((): boolean => {
    if (!currentLobby) return false;

    const player = currentGame?.players?.find((player) => player.userId === credentials?.user);
    if (!player) return false;

    const currentPlayerBetsAmount = player.bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (currentPlayerBetsAmount < currentLobby?.minBet) return false;

    return true;
  }, [credentials?.user, currentGame?.players, currentLobby]);

  const handleInsurance = useCallback(
    (hasInsured: boolean) => {
      if (isLocked('player-insurance')) return;
      setLock('player-insurance', true);
      if (!currentLobby) return;
      sockets.emit(`blackjack:insurance`, {
        lobbyId: currentLobby.id,
        userId: credentials?.user,
        hasInsured,
      });
    },
    [credentials?.user, currentLobby, isLocked, setLock],
  );

  return (
    <div className="relative flex w-full justify-center">
      <div className="h-[548px] w-full max-w-[1200px] justify-center bg-[url('/src/assets/table-bg.png')] bg-contain bg-center bg-no-repeat">
        <InfoTooltip
          className="absolute top-5.5 right-[unset] bottom-[unset] left-1/2 z-20 mt-1 translate-x-[520px]"
          tooltipClass="min-w-[250px]  min-h-fitt right-0 left-[unset] top-5"
          content={
            <div className="flex flex-col gap-2">
              <div>
                The goal of Blackjack is to have a card total higher than the virtual dealer without going over 21. The
                strongest hand is a Blackjack, which happens when the first two cards dealt add up to exactly 21.
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
        <TableChips />

        <div
          onClick={handleOpenBJHistoryModal}
          className="absolute top-5 right-[unset] bottom-[unset] left-1/2 z-20 mt-1 w-[20px] translate-x-[550px] cursor-pointer select-none"
        >
          <img src={fairnessCheckmarkIcon} />
        </div>

        <TableSeats />

        {currentGame?.dealerHand?.map((card, i) => (
          <Card
            key={`dealer-card-${i}`}
            value={card}
            faceDown={!card}
            className="absolute z-50 flex -translate-x-1/2 -translate-y-1/2 select-none"
            fromX={i === 1 ? 600 + i * 24 : 600}
            fromY={i === 1 ? 548 * 0.3 + i * 11 : 0}
            toX={600 + i * 24}
            toY={548 * 0.3 + i * 11}
            initialOpacity={i === 1 ? 1 : 0}
          />
        ))}

        {currentGame?.dealerHand?.length === 1 &&
          currentGame?.players?.every(
            (player) => player.hands[0]?.hand?.length >= 2 || player.hands[0]?.hasSplitted,
          ) && (
            <Card
              faceDown
              className="absolute z-50 flex -translate-x-1/2 -translate-y-1/2 select-none"
              delay={0.7}
              fromX={600}
              fromY={0}
              toX={600 + 24}
              toY={548 * 0.3 + 11}
            />
          )}

        {currentGame?.dealerHand && currentGame?.dealerHand?.length > 0 && (
          <div className="absolute top-[38%] left-[50%] z-50 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[5px] border border-[#253C60] bg-[#08152A] text-[16px] font-bold select-none">
            {dealerHandTotal}
          </div>
        )}

        {currentGame?.players?.some((player) => player.userId === credentials?.user) &&
          isGreaterThanMinBet() &&
          currentGame?.status === BlackjackGameStatus.PLAYING && (
            <>
              {currentGame?.insuranceTimerActive && askInsurance ? (
                <div className="absolute top-[55%] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 select-none">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-center gap-4">
                      <div
                        onClick={() => handleInsurance(true)}
                        className={classNames(
                          'flex h-18 w-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-[#00CF56cc] text-[13px] font-black text-white',
                          isLocked('player-insurance') ? 'cursor-default opacity-[0.5]' : 'hover:bg-[#00CF56]',
                        )}
                      >
                        <img src={insuranceYesIcon} alt="plus" />
                        YES
                      </div>
                      <div
                        onClick={() => handleInsurance(false)}
                        className={classNames(
                          'flex h-18 w-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-[#DE1432cc] text-[11px] font-black text-white',
                          isLocked('player-insurance') ? 'cursor-default opacity-[0.5]' : 'hover:bg-[#DE1432]',
                        )}
                      >
                        <img src={insuranceNoIcon} alt="minus" />
                        NO
                      </div>
                    </div>
                    {timeLeft > 0 && (
                      <div className="flex flex-col items-center justify-center gap-3 text-base font-bold tracking-[0.2em] text-white">
                        INSURANCE?
                        <div className="h-1 w-[145px] overflow-hidden rounded bg-[#08152A]">
                          <div
                            className="h-full rounded bg-[#4EC87D] transition-all duration-[100ms] ease-linear"
                            style={{
                              width: `${(timeLeft / 10) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                currentLobby &&
                currentGame?.currentPlayerId === credentials?.user && (
                  <div className="absolute top-[55%] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
                    <div className="flex flex-col gap-3">
                      <BlackjackBetOptions lobby={currentLobby} />
                      {timeLeft > 0 && (
                        <div className="h-1 w-[300px] overflow-hidden rounded bg-[#08152A]">
                          <div
                            className="h-full rounded bg-[#4EC87D] transition-all duration-[100ms] ease-linear"
                            style={{
                              width: `${(timeLeft / 10) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </>
          )}

        {currentGame?.players?.some((player) => player.userId === credentials?.user) &&
          isGreaterThanMinBet() &&
          [
            BlackjackGameStatus.RESOLVING_USER_PAYOUTS,
            BlackjackGameStatus.RESOLVING_BETS,
            BlackjackGameStatus.FINISHED,
          ].includes(currentGame?.status) && (
            <div className="absolute top-[55%] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
              <BlackjackPayoutResult currentGame={currentGame} currentUser={credentials?.user} />
            </div>
          )}

        <div className="flex w-full flex-col items-center pt-[200px] select-none">
          <div className="flex h-[44px] w-[362px] items-center justify-center bg-[url('/src/assets/game-header-bg.png')] bg-contain bg-center bg-no-repeat text-[20px] font-bold text-[#1C3A66]">
            BLACKJACK PAYS 3 TO 2
          </div>
          <div className="pt-4 text-[16px] font-bold text-[#102A51]">DEALER MUST STAND ON 17 AND DRAW ON 16</div>
          {currentLobby && currentLobby.sideBets && (
            <div className="flex gap-4 pt-6 text-[16px] font-bold text-[#102A51]">
              2 TO 1<img src={rhombus} />
              INSURANCE PAYS
              <img src={rhombus} />2 TO 1
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
