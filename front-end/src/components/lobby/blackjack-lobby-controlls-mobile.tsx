/* eslint-disable @typescript-eslint/no-explicit-any */
import { use, useCallback, useEffect, useMemo } from 'react';
import clearIcon from '../../assets/icons/common/clear-icon.svg';
import insuranceNoIcon from '../../assets/icons/common/insurance-no.svg';
import insuranceYesIcon from '../../assets/icons/common/insurance-yes.svg';
import rebetIcon from '../../assets/icons/common/loop-icon.svg';
import minusIcon from '../../assets/icons/common/minus-icon.svg';
import plusIcon from '../../assets/icons/common/plus-icon.svg';
import splitLeft from '../../assets/icons/common/split-left.svg';
import splitRight from '../../assets/icons/common/split-right.svg';
import undoIcon from '../../assets/icons/common/undo-icon.svg';
import { sockets } from '../../lib/interaction/sockets';
import { BreakpointEnum, classNames, useBreakpoint } from '../../lib/utils';
import { useLobby } from '../../providers/lobby/context';
import { useMedia } from '../../providers/media/context';
import { resourceManager } from '../../providers/resource-manager';
import { SocketLockContext } from '../../providers/socket-locks/context';
import { useCredentials } from '../../queries/auth';
import { BlackjackGame, BlackjackGameStatus } from '../../queries/blackjack';
import { notify } from '../toast';
import { LobbyMobilePlaceBetControll } from './lobby-mobile-place-bet-controll';
import { chipMap } from './lobby-table-seats';
import { GenericButton } from '../common/buttons';
import { useBlackjack } from '../../providers/blackjack/context';
import { useUser } from '../../queries/user';

interface BlackjackLobbyControllsMobileProps {
  currentGame?: BlackjackGame;
  timeLeft: number;
  askInsurance: boolean;
  currentDealNow: number;
}

export const BlackjackLobbyControllsMobile = ({
  currentGame,
  timeLeft,
  askInsurance,
  currentDealNow,
}: BlackjackLobbyControllsMobileProps) => {
  const { lobby } = useLobby();
  const { data: credentials } = useCredentials();
  const { isLocked, setLock } = use(SocketLockContext);
  const isXXSScreen = useBreakpoint(BreakpointEnum.XXS);
  const { isMuted } = useMedia();
  const { handleChangeBetAmount, selectedBetAmount, onPlaceBet } = useBlackjack();
  const { data: user } = useUser();

  useEffect(() => {
    if (selectedBetAmount && selectedBetAmount > 0) return;
    if (!lobby || !credentials.user || !user || !currentGame) return;

    const availableChips = [0.5, 1, 5, 10, 25, 50, 100];
    const userBalance = user.balance;
    const minBet = lobby.minBet;
    const maxBet = lobby.maxBet;

    const optimalChip = availableChips
      .filter((chip) => chip >= minBet && chip <= maxBet && chip <= userBalance)
      .sort((a, b) => b - a)[0];

    if (optimalChip) {
      handleChangeBetAmount(optimalChip);
    } else {
      handleChangeBetAmount(availableChips[0]);
    }
  }, [credentials.user, currentGame, lobby, handleChangeBetAmount, selectedBetAmount, user]);

  const handleHit = useCallback(() => {
    if (!lobby?.id || isLocked('player-hit')) return;
    setLock('player-hit', true);
    sockets.emit('blackjack:action:hit', {
      lobbyId: lobby.id,
      userId: credentials?.user,
    });
  }, [credentials?.user, isLocked, lobby?.id, setLock]);

  const handleStand = useCallback(() => {
    if (!lobby?.id || isLocked('player-stand')) return;
    setLock('player-stand', true);
    sockets.emit('blackjack:action:stand', { lobbyId: lobby.id, userId: credentials?.user });
  }, [credentials?.user, isLocked, lobby?.id, setLock]);

  const handleInsurance = useCallback(
    (hasInsured: boolean) => {
      sockets.emit(`blackjack:insurance`, {
        lobbyId: lobby?.id,
        userId: credentials?.user,
        hasInsured,
      });
    },
    [credentials?.user, lobby?.id],
  );

  const isGreaterThanMinBet = useCallback((): boolean => {
    const player = currentGame?.players?.find((player) => player.userId === credentials?.user);
    if (!player) return false;

    const currentPlayerBetsAmount = player.bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (lobby && currentPlayerBetsAmount < lobby?.minBet) return false;

    return true;
  }, [credentials?.user, currentGame?.players, lobby]);

  const checkForDoubleDown = useCallback(() => {
    const userPlaying = currentGame?.players?.find((player) => player.userId === credentials?.user);

    if (!userPlaying) return false;

    const userHandPlaying = userPlaying.hands.find((hand) => userPlaying.currentHandId === hand.id);

    if (!userHandPlaying) return false;

    if (userHandPlaying.hasSplitted) return false;

    if (userHandPlaying.hand.length === 2 && userHandPlaying.handTotal < 21) return true;

    return false;
  }, [credentials?.user, currentGame?.players]);

  const handleDoubleDown = useCallback(() => {
    if (!lobby?.id || !checkForDoubleDown()) return;
    sockets.emit('blackjack:action:double', { lobbyId: lobby.id, userId: credentials?.user });
  }, [checkForDoubleDown, credentials?.user, lobby?.id]);

  const checkForSplit = useCallback(() => {
    const userPlaying = currentGame?.players?.find((player) => player.userId === credentials?.user);

    if (!userPlaying) return false;

    const userHandPlaying = userPlaying.hands.find((hand) => userPlaying.currentHandId === hand.id);

    if (!userHandPlaying) return false;

    if (userHandPlaying.hasSplitted || userHandPlaying.hand.length !== 2 || userHandPlaying.handTotal > 20)
      return false;

    const firstCardValue = userHandPlaying.hand[0].slice(0, 1);
    const secondCardValue = userHandPlaying.hand[1].slice(0, 1);

    if (firstCardValue === secondCardValue) return true;

    return false;
  }, [credentials?.user, currentGame?.players]);

  const handleSplit = useCallback(() => {
    if (!lobby?.id || !checkForSplit()) return;
    sockets.emit('blackjack:action:split', { lobbyId: lobby.id, userId: credentials?.user });
  }, [checkForSplit, credentials?.user, lobby?.id]);

  const handleControlsBet = useCallback(
    (controlType: string) => {
      if (!lobby) {
        notify('error', { title: 'Error', content: 'Lobby is not loaded' });
        return;
      }

      if (controlType === 'dealnow') {
        resourceManager.playAudio('deal-now', { volume: isMuted ? 0 : 100, clone: true });
        const player = currentGame?.players?.find((player) => player.userId === credentials?.user);

        const totalBetAmount = player?.bets.reduce((sum, bet) => sum + bet.amount, 0) ?? 0;
        if (totalBetAmount < lobby.minBet) {
          notify('error', { content: `You need to bet at least $${lobby.minBet.toFixed(2)}`, title: 'Error' });
          return;
        }
      }

      sockets.emit(`blackjack:bet:${controlType}`, {
        lobbyId: lobby.id,
        controlType,
      });

      sockets.once('blackjack:bet:error', (err: any) => {
        notify('error', { title: 'Error', content: err.message ?? 'Bet failed' });
      });
    },
    [credentials?.user, currentGame?.players, isMuted, lobby],
  );

  const mySeat = useMemo(
    () => currentGame?.players?.find((player) => player.userId === credentials?.user),
    [credentials?.user, currentGame?.players],
  );

  return (
    <div className="mb-20">
      {(currentGame?.status === BlackjackGameStatus.COUNTDOWN ||
        currentGame?.status === BlackjackGameStatus.WAITING_BETS) && (
        <div className="flex flex-col items-center justify-center">
          <div className="min-h-[21px]">
            {currentGame?.status === BlackjackGameStatus.COUNTDOWN && (
              <div className="z-50 flex flex-col items-center gap-2 pb-[17px]">
                <div className="h-1 w-[300px] overflow-hidden rounded bg-[#1D3353]">
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
          {/* Place Bet */}
          {currentGame?.players?.some((player) => player.userId === credentials?.user) && (
            <LobbyMobilePlaceBetControll seat={mySeat} handlePlaceBet={onPlaceBet} />
          )}
          {/* CHIPS */}
          {currentGame?.players?.some((player) => player.userId === credentials?.user) && (
            <div className="mb-6 flex flex-wrap justify-center gap-5 pt-10 max-sm:gap-3">
              {[0.5, 1, 5, 10, 25, 50, 100].map((amount) => (
                <button
                  key={`blackjack-bet-${amount}`}
                  onClick={() => {
                    handleChangeBetAmount(amount);
                  }}
                  className={classNames(
                    'cursor-pointer rounded-full pt-0.5 transition-all duration-100',
                    'roulette-chip',
                    selectedBetAmount === amount ? 'shadow-[0_0_10px_1.25px_#4EC87D] ring-1 ring-[#4EC87D]' : '',
                  )}
                >
                  <div className="relative flex h-20 w-20 items-center justify-center max-sm:h-[39px] max-sm:w-[39px]">
                    <img
                      src={chipMap[amount]}
                      alt={`Chip ${amount}`}
                      className={classNames(
                        'transition-transform duration-100',
                        selectedBetAmount === amount ? 'scale-90' : 'scale-100',
                      )}
                    />
                    <span
                      className={classNames(
                        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20px] font-extrabold drop-shadow-sm max-sm:text-sm',
                        amount === 0.5 ? 'text-[#2B272A]' : 'text-white',
                        amount === 0.5 || amount === 100 ? 'text-[18px]' : '',
                      )}
                    >
                      ${amount}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {/* AMOUNT BUTTONS */}
          {currentGame?.players?.some((player) => player.userId === credentials?.user) && (
            <div className="mb-6 flex gap-2">
              <GenericButton
                skin="betControl"
                leftIcon={<img src={rebetIcon} />}
                onClick={() => handleControlsBet('rebet')}
                className="bet-control-button"
                text="REBET"
              />
              <GenericButton
                skin="betControl"
                leftIcon={<img src={undoIcon} />}
                onClick={() => handleControlsBet('undo')}
                className="bet-control-button"
                text="UNDO"
              />
              <GenericButton
                skin="betControl"
                onClick={() => handleControlsBet('x2')}
                className="bet-control-button"
                text="X2 BET"
              />
              <GenericButton
                skin="betControl"
                leftIcon={<img src={clearIcon} />}
                onClick={() => handleControlsBet('clear')}
                className="bet-control-button"
                text="CLEAR"
              />
            </div>
          )}
          {currentGame?.players?.some((player) => player.userId === credentials?.user) &&
            isGreaterThanMinBet() &&
            currentGame?.status === BlackjackGameStatus.COUNTDOWN && (
              <div
                onClick={() => handleControlsBet('dealnow')}
                className={classNames(
                  'deal-now absolute top-[450px] left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-2 text-[13px] font-bold text-[#FFB367] uppercase max-lg:top-[350px] max-md:top-[280px] max-sm:top-[230px]',
                  isXXSScreen ? 'max-sm:top-[180px]' : '',
                  isLocked('deal-now')
                    ? 'cursor-default opacity-80'
                    : 'hover:scale-105 hover:border-2 hover:border-yellow-400',
                )}
              >
                Deal Now
                {currentGame && currentGame?.players?.length > 1 && (
                  <span className="text-white">
                    ({currentDealNow}/{currentGame?.players?.length})
                  </span>
                )}
              </div>
            )}
        </div>
      )}

      {currentGame?.players?.some((player) => player.userId === credentials?.user) &&
        isGreaterThanMinBet() &&
        currentGame?.status === BlackjackGameStatus.PLAYING && (
          <>
            {currentGame?.insuranceTimerActive && askInsurance ? (
              <div className="absolute top-[55%] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-center gap-4">
                    <div
                      onClick={() => handleInsurance(true)}
                      className={classNames(
                        'flex h-18 w-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-[#00CF56cc] text-[13px] font-black text-white hover:bg-[#00CF56]',
                        isLocked('player-insurance') ? 'cursor-default opacity-[0.5]' : '',
                      )}
                    >
                      <img src={insuranceYesIcon} alt="plus" />
                      YES
                    </div>
                    <div
                      onClick={() => handleInsurance(false)}
                      className={classNames(
                        'flex h-18 w-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-[#DE1432cc] text-[11px] font-black text-white hover:bg-[#DE1432]',
                        isLocked('player-insurance') ? 'cursor-default opacity-[0.5]' : '',
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
              currentGame?.currentPlayerId === credentials?.user && (
                <div className="top-[55%] z-50 flex flex-col items-center gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-center gap-4">
                      <div
                        onClick={handleDoubleDown}
                        className={classNames(
                          'flex h-18 w-18 flex-col items-center justify-center gap-[3px] rounded-xl bg-[#B55D26] text-white',
                          checkForDoubleDown() ? 'cursor-pointer' : 'opacity-[0.5] select-none',
                        )}
                      >
                        <span className="text-center text-xs font-bold">X2</span>
                        <span className="justify-center text-center text-[9px] font-black">DOUBLE DOWN</span>
                      </div>
                      <div
                        onClick={handleHit}
                        className={classNames(
                          'flex h-18 w-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-[#00CF56] text-[13px] font-black text-white',
                          isLocked('player-hit') ? 'cursor-default opacity-[0.5]' : '',
                        )}
                      >
                        <img src={plusIcon} alt="plus" />
                        HIT
                      </div>
                      <div
                        onClick={handleStand}
                        className={classNames(
                          'flex h-18 w-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-[#DE1432] text-[11px] font-black text-white',
                          isLocked('player-stand') ? 'cursor-default opacity-[0.5]' : '',
                        )}
                      >
                        <img src={minusIcon} alt="minus" />
                        STAND
                      </div>
                      <div
                        onClick={handleSplit}
                        className={classNames(
                          'flex h-18 w-18 flex-col items-center justify-center gap-2 rounded-xl bg-[#479FBF] text-[11px] font-black text-white',
                          checkForSplit() ? 'cursor-pointer' : 'opacity-[0.5] select-none',
                        )}
                      >
                        <div className="flex gap-1">
                          <img src={splitLeft} alt="split-left" />
                          <img src={splitRight} alt="split-right" />
                        </div>
                        SPLIT
                      </div>
                    </div>
                    {timeLeft > 0 && (
                      <div className="h-2 w-[300px] overflow-hidden rounded bg-[#1D3353]">
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
    </div>
  );
};
