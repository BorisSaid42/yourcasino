/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import dealNowSound from '../../assets/deal-now.mp3';
import cardDealSound from '../../assets/table/card_deal_sound.mp3';
import cardFlipSound from '../../assets/table/card_flip.mp3';
import winSound from '../../assets/win-sound.mp3';
import { sockets } from '../../lib/interaction/sockets';
import { socketJoinLeaveEmit } from '../../lib/sockets';
import { BreakpointEnum, classNames, useBreakpoint } from '../../lib/utils';
import { useLobby } from '../../providers/lobby/context';
import { useMedia } from '../../providers/media/context';
import { ModalContext } from '../../providers/modal/context';
import { resourceManager } from '../../providers/resource-manager';
import { useCredentials } from '../../queries/auth';
import { BlackjackGameStatus, useCurrentGame } from '../../queries/blackjack';
import { LobbyGame, LobbyState } from '../../queries/lobby';
import { notify } from '../toast';
import { BlackjackDesktopControls } from './blackjack-desktop/blackjack-desktop-controls';
import { BlackjackDesktopNav } from './blackjack-desktop/blackjack-desktop-nav';
import { BlackjackTableView } from './blackjack-desktop/blackjack-table-view';
import { BlackJackLobbyMobile } from './blackjack-lobby-mobile';
import { LobbyOwnerStatisticsMobile } from './lobby-owner-statistics-mobile';
import { LobbyOwnerStatisticsSidebar } from './lobby-owner-statistics-sidebar';
import { SocketLockContext } from '../../providers/socket-locks/context';

export const Lobby = () => {
  const isSmallerScreen = useBreakpoint(BreakpointEnum.XL);
  const { lobby } = useLobby();
  const navigate = useNavigate();
  const { data: credentials } = useCredentials();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const timerDeadlineRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { data: currentGame } = useCurrentGame(lobby?.id);
  const [currentDealNow, setCurrentDealNow] = useState(0);
  const { openModal } = use(ModalContext);
  const { isMuted } = useMedia();
  const { isLocked, setLock } = use(SocketLockContext);
  const [askInsurance, setAskInsurance] = useState<boolean>(false);

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

  const isGreaterThanMinBet = useCallback((): boolean => {
    if (!lobby) return false;

    const player = currentGame?.players?.find((player) => player.userId === credentials?.user);
    if (!player) return false;

    const currentPlayerBetsAmount = player.bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (currentPlayerBetsAmount < lobby?.minBet) return false;

    return true;
  }, [credentials?.user, currentGame?.players, lobby]);

  const handleControlsBet = useCallback(
    (controlType: string) => {
      if (!lobby) {
        notify('error', { content: 'Lobby is not loaded.', title: 'Error' });
        return;
      }

      if (controlType === 'dealnow') {
        if (isLocked('deal-now')) return;
        setLock('deal-now', true);
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
        notify('error', { content: err.message || 'Bet failed', title: 'Error' });
      });
    },
    [credentials?.user, currentGame?.players, isLocked, isMuted, lobby, setLock],
  );

  useEffect(() => {
    if (!lobby?.id) return;

    if (!lobby.isBlackjackEnabled) {
      navigate({ to: `/lobby/${lobby.code}/` });
    }
  }, [lobby?.code, lobby?.id, lobby?.isBlackjackEnabled, navigate]);

  useEffect(() => {
    if (!lobby?.id) return;

    const handleJoin = () => {
      sockets.emit('blackjack:room:join', { lobbyId: lobby?.id });
    };
    const handleLeave = () => {
      sockets.emit('blackjack:room:leave', { lobbyId: lobby?.id });
    };

    return socketJoinLeaveEmit('blackjack', handleJoin, handleLeave);
  }, [lobby?.id]);

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
    if (lobby && lobby.status !== LobbyState.ACTIVE && !currentGame) {
      openModal({ key: 'lobby-deactivated', props: { code: lobby.code }, closable: false, lightBlur: true });
    }
  }, [currentGame, lobby, lobby?.code, lobby?.status, openModal]);

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
    if (!lobby || !lobby.isBlackjackEnabled || lobby.bankroll > lobby.minBet) return;

    const canPlayRoulette = lobby.isRouletteEnabled && lobby.rouletteBankroll > lobby.rouletteMinBet;

    openModal({
      key: 'bankroll-insufficient-funds',
      props: { code: lobby.code, game: LobbyGame.BLACKJACK, canPlayRoulette },
      closable: false,
      lightBlur: true,
    });
  }, [lobby, openModal]);

  useEffect(() => {
    Promise.all([
      resourceManager.loadAudio('deal-now', dealNowSound),
      resourceManager.loadAudio('card-flip', cardFlipSound),
      resourceManager.loadAudio('card-deal', cardDealSound),
      resourceManager.loadAudio('win-sound', winSound),
    ]).catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  if (!lobby) {
    return (
      <div className="flex h-[300px] items-center justify-center text-xl text-[#6E88AF]">
        Lobby not found or failed to load.
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-10">
        <div className="relative flex w-full flex-col items-center justify-center gap-9 pt-12 pb-96 max-xl:py-2.5 max-md:min-h-[calc(100vh_-_63px)] max-md:justify-start max-sm:min-h-[calc(100vh_-_63px)]">
          {!isSmallerScreen ? (
            <>
              <BlackjackDesktopNav />
              <BlackjackTableView askInsurance={askInsurance} timeLeft={timeLeft} />
              {currentGame?.players?.some((player) => player.userId === credentials?.user) && (
                <BlackjackDesktopControls timeLeft={timeLeft} />
              )}
              {currentGame?.players?.some((player) => player.userId === credentials?.user) &&
                isGreaterThanMinBet() &&
                currentGame?.status === BlackjackGameStatus.COUNTDOWN && (
                  <div
                    onClick={() => handleControlsBet('dealnow')}
                    className={classNames(
                      'deal-now absolute top-[490px] left-1/2 flex -translate-x-13/24 cursor-pointer gap-2 px-2.5 py-4 text-[13px] font-bold text-[#FFB367] uppercase select-none',
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
            </>
          ) : (
            <div className="w-full max-w-[1200px] self-center">
              <BlackJackLobbyMobile />
              {credentials?.user === lobby?.ownerId && isSmallerScreen && (
                <div className="p-5">
                  <LobbyOwnerStatisticsMobile game="blackjack" lobbyDatails={lobby} />
                </div>
              )}
            </div>
          )}
        </div>
        {credentials?.user === lobby.ownerId && !isSmallerScreen && (
          <LobbyOwnerStatisticsSidebar lobbyDatails={lobby} game="blackjack" />
        )}
      </div>
    </>
  );
};
