import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, use, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthModalOpened } from '../../components/modals/auth/auth-modal.enum';
import { notify } from '../../components/toast';
import { sockets } from '../../lib/interaction/sockets';
import { useCredentials } from '../../queries/auth';
import {
  BlackjackGame,
  BlackjackGameBet,
  BlackjackGameStatus,
  BlackjackHand,
  Player,
  qo_getBlackjackCurrentGame,
  useCurrentGame,
} from '../../queries/blackjack';
import { LobbyType } from '../../queries/lobby';
import { useIsBlackjackPaused } from '../../queries/maintenance';
import { useLobby } from '../lobby/context';
import { ModalContext, ModalKey, ModalOptions } from '../modal/context';
import { SocketLockContext } from '../socket-locks/context';
import { BlackjackContext, BlackjackContextType } from './context';

export function BlackjackProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { lobby } = useLobby();
  const { data: credentials } = useCredentials();
  const { setLock } = use(SocketLockContext);
  const { data: isBlackjackPaused } = useIsBlackjackPaused();
  const { data: currentGame } = useCurrentGame(lobby?.id);
  const { openModal } = use(ModalContext);

  const [isBlackjackMaxWinWarning, setIsBlackjackMaxWinWarning] = useState<boolean>(false);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number | null>(null);

  const handleChangeBetAmount = useCallback((newBetAmount: number) => {
    setSelectedBetAmount(newBetAmount);
  }, []);

  const onPlaceBet = useCallback(
    (betPlace: string, lobby: LobbyType, currentGame: BlackjackGame) => {
      if (selectedBetAmount === null) {
        notify('warning', { title: 'Warning', content: 'Select the bet amount first.' });
        return;
      }

      if (!lobby) {
        notify('error', { title: 'Error', content: 'Lobby is not loaded.' });
        return;
      }

      if (
        currentGame?.status === BlackjackGameStatus.WAITING_BETS ||
        currentGame?.status === BlackjackGameStatus.COUNTDOWN
      ) {
        sockets.emit('blackjack:bet', {
          lobbyId: lobby.id,
          amount: selectedBetAmount,
          betPlace,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sockets.once('blackjack:bet:error', (err: any) => {
          notify('error', { title: 'Error', content: err.message || 'Bet failed' });
        });
      }
    },
    [selectedBetAmount],
  );

  const handleJoinSeat = useCallback(
    (
      seatIndex: number,
      openModal: (options: ModalOptions<ModalKey>) => void,
      lobby: LobbyType,
      currentGame: BlackjackGame,
    ) => {
      if (!lobby?.id) return;

      if (
        currentGame?.players?.some((player) => player.userId === credentials?.user) ||
        lobby.ownerId === credentials?.user
      )
        return;

      if (!credentials?.user) {
        openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
        return;
      }

      sockets.emit('blackjack:join', { lobbyId: lobby.id, seatIndex });

      sockets.once('blackjack:join:error', (err) => {
        notify('error', { title: 'Error', content: err.message });
      });
    },
    [credentials?.user],
  );

  const handleLeaveSeat = useCallback((seatIndex: number, lobbyId: string) => {
    sockets.emit('blackjack:leave', { lobbyId, seatIndex });

    sockets.once('blackjack:leave:error', (err) => {
      notify('error', { title: 'Error', content: err.message });
    });
  }, []);

  const handleSetIsBlackjackMaxWinWarning = useCallback((isWarning: boolean) => {
    setIsBlackjackMaxWinWarning(isWarning);
  }, []);

  useEffect(() => {
    if (isBlackjackPaused && !currentGame) {
      return openModal({
        key: 'maintenance-paused',
        props: {},
        closable: false,
        lightBlur: true,
      });
    }
  }, [currentGame, isBlackjackPaused, openModal]);

  useEffect(() => {
    const handleException = () => {
      setLock('player-stand', false);
      setLock('player-hit', false);
    };

    const handleBlackjackMaxWinWarning = (maxWinWarning: boolean) => {
      handleSetIsBlackjackMaxWinWarning(maxWinWarning);
    };

    const handleBlackjackGameChange = (game: BlackjackGame) => {
      setLock('player-stand', false);
      setLock('player-hit', false);
      queryClient.setQueryData<BlackjackGame>(['blackjack', 'game', 'current', game.lobbyId], game);
    };

    const isFullHand = (hand: BlackjackHand | { handTotal: number; hand: string[] }): hand is BlackjackHand =>
      'id' in hand;

    const handleBlackjackStatusUpdate = (data: { lobbyId: string; status: BlackjackGameStatus }) => {
      setLock('player-insurance', false);
      setLock('deal-now', false);
      queryClient.setQueryData<BlackjackGame>(qo_getBlackjackCurrentGame(data.lobbyId).queryKey, (game) => {
        if (!game) return game;

        return {
          ...game,
          status: data.status,
        };
      });
    };

    const handleCardDealt = (data: {
      lobbyId: string;
      playerId: string;
      hand: BlackjackHand | { handTotal: number; hand: string[] };
    }) => {
      queryClient.setQueryData<BlackjackGame>(qo_getBlackjackCurrentGame(data.lobbyId).queryKey, (game) => {
        if (!game) return game;

        if (data.playerId === 'dealer') {
          return {
            ...game,
            dealerHandTotal: data.hand.handTotal,
            dealerHand: [...game.dealerHand, ...data.hand.hand],
          };
        }

        return {
          ...game,
          players: game.players.map((player) => {
            if (player.id !== data.playerId) return player;

            if (isFullHand(data.hand)) {
              const handReceived = data.hand;
              const playerCurrentHand = player.hands.find((playerHand) => playerHand.id === handReceived.id);

              return {
                ...player,
                hands: playerCurrentHand
                  ? player.hands.map((h) => (h.id === handReceived.id ? handReceived : h))
                  : [...player.hands, handReceived],
                currentHandId: data.hand.id,
              };
            }
            return player;
          }),
        };
      });
    };

    const handleBlackjackError = (data: { errorMessage: string }) => {
      notify('error', { title: 'Error', content: data.errorMessage ?? 'Bet failed' });
    };

    const handleGameStatsUpdate = (data: { lobbyId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['lobby', 'stats', data.lobbyId, 'blackjack'] });
    };

    const handleMaintananceStatusUpdated = (data: { lobbyId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['blackjack', 'game', 'current', data.lobbyId] });
    };

    const handleBlackjackPlayerJoined = (data: { player: Player }) => {
      if (!lobby) return;
      queryClient.setQueryData<BlackjackGame>(qo_getBlackjackCurrentGame(lobby.id).queryKey, (game) => {
        if (!game) return game;

        return {
          ...game,
          players: [...game.players, data.player],
        };
      });
    };

    const handleBlackjackPlayerLeave = (data: { playerId: string }) => {
      if (!lobby) return;
      queryClient.setQueryData<BlackjackGame>(qo_getBlackjackCurrentGame(lobby.id).queryKey, (game) => {
        if (!game) return game;

        return {
          ...game,
          players: game.players.filter((player) => player.id !== data.playerId),
        };
      });
    };

    const handleBlackjackBetPlaced = (data: { playerId: string; bets: BlackjackGameBet[] }) => {
      if (!lobby) return;
      queryClient.setQueryData<BlackjackGame>(qo_getBlackjackCurrentGame(lobby.id).queryKey, (game) => {
        if (!game) return game;

        return {
          ...game,
          players: game.players.map((player) => {
            if (player.id !== data.playerId) return player;

            return {
              ...player,
              bets: data.bets,
            };
          }),
        };
      });
    };

    sockets.on('exception', handleException);
    sockets.on('blackjack:game:update', handleBlackjackGameChange);
    sockets.on('blackjack:status:update', handleBlackjackStatusUpdate);
    sockets.on('blackjack:card-dealt', handleCardDealt);
    sockets.on('game:stats:update', handleGameStatsUpdate);
    sockets.on('blackjack:error', handleBlackjackError);
    sockets.on('blackjack:max-win-warning', handleBlackjackMaxWinWarning);
    sockets.on('blackjack:maintenance-updated', handleMaintananceStatusUpdated);

    sockets.on('blackjack:player:joined', handleBlackjackPlayerJoined);
    sockets.on('blackjack:player:leave', handleBlackjackPlayerLeave);
    sockets.on('blackjack:player:bet', handleBlackjackBetPlaced);

    return () => {
      sockets.off('exception', handleException);
      sockets.off('blackjack:game:update', handleBlackjackGameChange);
      sockets.off('blackjack:status:update', handleBlackjackStatusUpdate);
      sockets.off('blackjack:card-dealt', handleCardDealt);
      sockets.off('game:stats:update', handleGameStatsUpdate);
      sockets.off('blackjack:error', handleBlackjackError);
      sockets.off('blackjack:max-win-warning', handleBlackjackMaxWinWarning);
      sockets.off('blackjack:maintenance-updated', handleMaintananceStatusUpdated);

      sockets.off('blackjack:player:joined', handleBlackjackPlayerJoined);
      sockets.off('blackjack:player:leave', handleBlackjackPlayerLeave);
      sockets.off('blackjack:player:bet', handleBlackjackBetPlaced);
    };
  }, [credentials, handleSetIsBlackjackMaxWinWarning, lobby, queryClient, setLock]);

  const value = useMemo<BlackjackContextType>(
    () => ({
      isBlackjackMaxWinWarning,
      handleChangeBetAmount,
      selectedBetAmount,
      onPlaceBet,
      handleJoinSeat,
      handleLeaveSeat,
    }),
    [handleLeaveSeat, handleJoinSeat, handleChangeBetAmount, isBlackjackMaxWinWarning, selectedBetAmount, onPlaceBet],
  );

  return <BlackjackContext.Provider value={value}>{children}</BlackjackContext.Provider>;
}
