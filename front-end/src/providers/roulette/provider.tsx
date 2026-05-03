import { useQueryClient } from '@tanstack/react-query';
import { ReactNode } from '@tanstack/react-router';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { notify } from '../../components/toast';
import { SocketException, sockets } from '../../lib/interaction/sockets';
import { useCredentials } from '../../queries/auth';
import {
  qo_getRouletteHistory,
  qo_getUserRouletteBets,
  qo_getLobbyAggregatedBets,
  RouletteAggregatedBet,
  RouletteGame,
  RouletteGameStatus,
  RouletteResultHistory,
  RouletteUserBet,
  useCurrentGame,
} from '../../queries/roulette';
import { RouletteContext } from './context';
import { useLobby } from '../lobby/context';
import { useIsRoulettePaused } from '../../queries/maintenance';
import { ModalContext } from '../modal/context';
import { SocketLockContext } from '../socket-locks/context';

export type RoulleteBetMapObject = {
  [key: string]: number[];
};

export function RouletteProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: credentials } = useCredentials();
  const { lobby } = useLobby();
  const { data: isRoulettePaused } = useIsRoulettePaused();
  const { data: currentGame } = useCurrentGame(lobby?.id ?? '');
  const { openModal } = use(ModalContext);

  const [selectedChipAmount, setSelectedChipAmount] = useState(0);
  const [currentLobbyId, setCurrentLobbyId] = useState('');
  const [rouletteBetsMap, setRouletteBetsMap] = useState<RoulleteBetMapObject | null>(null);
  const [lastBetsMap, setLastBetsMap] = useState<RoulleteBetMapObject | null>(null);
  const [rouletteGameStatus, setRouletteGameStatus] = useState<RouletteGameStatus>();
  const [isRouletteMaxWinWarning, setIsRouletteMaxWinWarning] = useState<boolean>(false);
  const { setLock } = use(SocketLockContext);

  const handleSetIsRouletteMaxWinWarning = useCallback((isWarning: boolean) => {
    setIsRouletteMaxWinWarning(isWarning);
  }, []);

  const handleSetGameStatus = useCallback((newStatus: RouletteGameStatus) => {
    setRouletteGameStatus(newStatus);
  }, []);

  useEffect(() => {
    if (isRoulettePaused && !currentGame) {
      return openModal({
        key: 'maintenance-paused',
        props: {},
        closable: false,
        lightBlur: true,
      });
    }
  }, [currentGame, isRoulettePaused, openModal]);

  useEffect(() => {
    const handleException = (e: SocketException) => {
      if (e.cause.pattern.startsWith('roulette:action')) {
        notify('error', { content: e.message, title: 'Error' });
      }
    };

    const handleRouletteGameChange = (game: RouletteGame) => {
      handleSetGameStatus(game.status);

      if (game.status === RouletteGameStatus.FINISHED) {
        queryClient.setQueryData<RouletteResultHistory[]>(qo_getRouletteHistory(game.lobbyId).queryKey, (history) => {
          if (!history) return history;

          return [{ id: game.id, result: game.result }, ...history];
        });
        queryClient.invalidateQueries({ queryKey: ['user', 'roulette', 'bets', game.lobbyId, credentials?.user] });
      }
      queryClient.setQueryData<RouletteGame>(['roulette', 'game', 'current', game.lobbyId], game);
    };

    const handleRouletteStatusUpdate = (data: { lobbyId: string; status: RouletteGameStatus }) => {
      setLock('roulette-rollnow', false);
      handleSetGameStatus(data.status);
      queryClient.setQueryData<RouletteGame>(['roulette', 'game', 'current', data.lobbyId], (game) => {
        if (!game) return game;
        return { ...game, status: data.status };
      });
    };

    const handleRouletteMaxWinWarning = (maxWinWarning: boolean) => {
      handleSetIsRouletteMaxWinWarning(maxWinWarning);
    };

    const handleRouletteNewGame = (game: RouletteGame) => {
      handleSetGameStatus(game.status);
      if (game.status === RouletteGameStatus.WAITING_BETS) {
        setIsRouletteMaxWinWarning(false);
      }
      queryClient.setQueryData<RouletteGame>(['roulette', 'game', 'current', game.lobbyId], game);
      queryClient.setQueryData<RouletteUserBet[]>(['user', 'roulette', 'bets', game.lobbyId, credentials?.user], []);
    };

    const handleRouletteBetPlaced = (data: { lobbyId: string; bet: RouletteUserBet }) => {
      if (data.bet.userId !== credentials?.user) return;
      queryClient.setQueryData<RouletteUserBet[]>(
        qo_getUserRouletteBets(credentials?.user, data.lobbyId).queryKey,
        (bets) => {
          if (!bets) return bets;

          return [...bets, data.bet];
        },
      );
    };

    const handleRouletteUndoBets = (data: { userId: string; lobbyId: string; bets: RouletteUserBet[] }) => {
      if (data.userId !== credentials?.user) return;

      queryClient.setQueryData<RouletteUserBet[]>(
        qo_getUserRouletteBets(credentials?.user, data.lobbyId).queryKey,
        (bets) => {
          if (!bets) return bets;

          const betsToRemove = new Set(data.bets.map((b) => b.id));
          return bets.filter((bet) => !betsToRemove.has(bet.id));
        },
      );
    };

    const handleRouletteMultipleBetsPlaced = (data: { userId: string; lobbyId: string; bets: RouletteUserBet[] }) => {
      if (data.userId !== credentials?.user) return;
      queryClient.setQueryData<RouletteUserBet[]>(
        qo_getUserRouletteBets(credentials?.user, data.lobbyId).queryKey,
        (bets) => {
          if (!bets) return bets;

          return [...bets, ...data.bets];
        },
      );
    };

    const handleGameStatsUpdate = (data: { lobbyId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['lobby', 'stats', data.lobbyId, 'roulette'] });
    };

    const handleMaintananceStatusUpdated = (data: { lobbyId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['roulette', 'game', 'current', data.lobbyId] });
    };

    const handleRouletteBetsUpdate = (data: { lobbyId: string; bets: RouletteAggregatedBet[] }) => {
      queryClient.setQueryData<RouletteAggregatedBet[]>(qo_getLobbyAggregatedBets(data.lobbyId).queryKey, data.bets);
    };

    sockets.on('exception', handleException);
    sockets.on('roulette:game:update', handleRouletteGameChange);
    sockets.on('roulette:status:update', handleRouletteStatusUpdate);
    sockets.on('roulette:stats:update', handleGameStatsUpdate);
    sockets.on('roulette:new:game', handleRouletteNewGame);
    sockets.on('roulette:bet:placed', handleRouletteBetPlaced);
    sockets.on('roulette:bets:undo', handleRouletteUndoBets);
    sockets.on('roulette:multi-bets:placed', handleRouletteMultipleBetsPlaced);
    sockets.on('roulette:bets:update', handleRouletteBetsUpdate);
    sockets.on('roulette:max-win-warning', handleRouletteMaxWinWarning);
    sockets.on('roulette:maintenance-updated', handleMaintananceStatusUpdated);

    return () => {
      sockets.off('exception', handleException);
      sockets.off('roulette:game:update', handleRouletteGameChange);
      sockets.off('roulette:status:update', handleRouletteStatusUpdate);
      sockets.off('roulette:stats:update', handleGameStatsUpdate);
      sockets.off('roulette:new:game', handleRouletteNewGame);
      sockets.off('roulette:bet:placed', handleRouletteBetPlaced);
      sockets.off('roulette:bets:undo', handleRouletteUndoBets);
      sockets.off('roulette:multi-bets:placed', handleRouletteMultipleBetsPlaced);
      sockets.off('roulette:bets:update', handleRouletteBetsUpdate);
      sockets.off('roulette:max-win-warning', handleRouletteMaxWinWarning);
      sockets.off('roulette:maintenance-updated', handleMaintananceStatusUpdated);
    };
  }, [
    credentials?.user,
    handleSetGameStatus,
    handleSetIsRouletteMaxWinWarning,
    queryClient,
    rouletteGameStatus,
    setLock,
  ]);

  const handleAddRouleteBet = useCallback((field: string, value: number) => {
    setRouletteBetsMap((prevState) => {
      const newState = {
        ...prevState,
      };

      if (!prevState) {
        return { [field]: [value] };
      }

      if (prevState[field]) {
        newState[field] = [...prevState[field], value];
      } else {
        newState[field] = [value];
      }

      return newState;
    });
  }, []);

  const handleRemoveFieldBet = useCallback((field: string) => {
    setRouletteBetsMap((prevState) => {
      if (!prevState) {
        return null;
      }

      if (!prevState?.[field]) {
        return prevState;
      }

      return {
        ...prevState,
        [field]: prevState[field].slice(0, prevState[field].length - 1),
      };
    });
  }, []);

  const handleRouletteBet = useCallback(
    (field: string, value: number, operation = '+') => {
      if (operation === '+') {
        return handleAddRouleteBet(field, value);
      }

      return handleRemoveFieldBet(field);
    },
    [handleAddRouleteBet, handleRemoveFieldBet],
  );

  const handleChangeSelectedChipAmount = useCallback((newAmount: number) => {
    setSelectedChipAmount(newAmount);
  }, []);

  const handleChangeCurrentLobbyId = useCallback((lobbyId: string) => {
    setCurrentLobbyId(lobbyId);
  }, []);

  const handleSetLastBetsMap = useCallback(() => {
    setLastBetsMap(rouletteBetsMap);
  }, [rouletteBetsMap]);

  const handleRebet = useCallback(() => {
    setRouletteBetsMap(lastBetsMap);
  }, [lastBetsMap]);

  const handleClearBet = useCallback(() => {
    setRouletteBetsMap(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedChipAmount,
      currentLobbyId,
      handleChangeSelectedChipAmount,
      handleChangeCurrentLobbyId,
      rouletteBetsMap,
      handleRouletteBet,
      rouletteGameStatus,
      handleSetGameStatus,
      lastBetsMap,
      handleSetLastBetsMap,
      handleRebet,
      handleClearBet,
      isRouletteMaxWinWarning,
    }),
    [
      selectedChipAmount,
      currentLobbyId,
      handleChangeSelectedChipAmount,
      handleChangeCurrentLobbyId,
      rouletteBetsMap,
      handleRouletteBet,
      rouletteGameStatus,
      handleSetGameStatus,
      lastBetsMap,
      handleSetLastBetsMap,
      handleRebet,
      handleClearBet,
      isRouletteMaxWinWarning,
    ],
  );

  return <RouletteContext.Provider value={value}>{children}</RouletteContext.Provider>;
}
