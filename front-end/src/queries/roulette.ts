import { queryOptions, useQuery } from '@tanstack/react-query';
import { LobbyType } from './lobby';
import { api } from '../lib/interaction/api';

export enum RouletteGameStatus {
  WAITING_BETS = 'waiting_bets',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export type RouletteGame = {
  id: string;
  status: RouletteGameStatus;
  result: number;
  lobby: LobbyType;
  lobbyId: string;
  bets: RouletteGameBet[];
  timerDeadline?: Date;
  timerType?: 'countdown' | null;
};

export type RouletteGameBet = {
  id: string;
  userId: string;
  username: string;
  amount: number;
  wonAmount: number;
  betPlace: string;
};

/**
 * Aggregated bet type - combines multiple bets from the same user on the same bet place
 * This is optimized for display in the bet list UI
 */
export type RouletteAggregatedBet = {
  userId: string;
  username: string;
  betPlace: string;
  amount: number;
  betCount: number;
};

export const qo_getRouletteCurrentGame = <T = RouletteGame>(lobbyId: string, select?: (game: RouletteGame) => T) =>
  queryOptions<RouletteGame, Error, T>({
    queryKey: ['roulette', 'game', 'current', lobbyId],
    queryFn: async () => {
      return api.get<RouletteGame, RouletteGame>(`/roulette/${lobbyId}/current`);
    },
    enabled: Boolean(lobbyId),
    select,
  });

export const useCurrentGame = <T = RouletteGame>(lobbyId: string, select?: (game: RouletteGame) => T) => {
  return useQuery(qo_getRouletteCurrentGame(lobbyId, select));
};

export type RouletteResultHistory = {
  id: string;
  result: number;
};

export const qo_getRouletteHistory = <T = RouletteResultHistory[]>(
  lobbyId?: string,
  select?: (history: RouletteResultHistory[]) => T,
) =>
  queryOptions<RouletteResultHistory[], Error, T>({
    queryKey: ['roulette', 'history', lobbyId],
    queryFn: async () => {
      return api.get<RouletteResultHistory[], RouletteResultHistory[]>(`/roulette/${lobbyId}/history`);
    },
    select,
  });

export const useRouletteHistory = <T = RouletteResultHistory[]>(
  lobbyId?: string,
  select?: (history: RouletteResultHistory[]) => T,
) => {
  return useQuery(qo_getRouletteHistory(lobbyId, select));
};

export type RouletteUserBet = {
  id: string;
  userId: string;
  betPlace: string;
  amount: number;
  wonAmount: number;
};

export const qo_getUserRouletteBets = <T = RouletteUserBet[]>(
  userId: string,
  lobbyId: string,
  select?: (bets: RouletteUserBet[]) => T,
) =>
  queryOptions<RouletteUserBet[], Error, T>({
    queryKey: ['user', 'roulette', 'bets', lobbyId, userId],
    queryFn: async () => {
      return api.get<RouletteUserBet[], RouletteUserBet[]>(`/roulette/${lobbyId}/bets`);
    },
    select,
    enabled: !!userId && !!lobbyId,
  });

export const useUserRouletteBets = <T = RouletteUserBet[]>(
  userId: string,
  lobbyId: string,
  select?: (bets: RouletteUserBet[]) => T,
) => {
  return useQuery(qo_getUserRouletteBets(userId!, lobbyId!, select));
};

export type RouletteFairnessData = {
  id: string;
  result: number;
  serverSeed: string;
  serverSeedHash: string;
  fairnessRandom: string;
};

export const qo_getRouletteFairnessData = <T = RouletteFairnessData>(
  gameId?: string,
  select?: (fairness: RouletteFairnessData) => T,
) =>
  queryOptions<RouletteFairnessData, Error, T>({
    queryKey: ['roulette', 'fairness', gameId],
    queryFn: async () => {
      return api.get<RouletteFairnessData, RouletteFairnessData>(`/roulette/${gameId}/fairness`);
    },
    select,
  });

export const useRouletteProvablyFair = <T = RouletteFairnessData>(
  gameId?: string,
  select?: (fairness: RouletteFairnessData) => T,
) => {
  return useQuery(qo_getRouletteFairnessData(gameId, select));
};

export type RouletteFairnessHistoryData = {
  id: string;
  serverSeed: string;
  fairnessRandom: string;
  result: string[];
  updatedAt: Date;
};

export const qo_getRouletteProvablyFairHistory = <T = RouletteFairnessHistoryData[]>(
  lobbyId?: string,
  select?: (fairness: RouletteFairnessHistoryData[]) => T,
) =>
  queryOptions<RouletteFairnessHistoryData[], Error, T>({
    queryKey: ['roulette', 'fairness', 'history', lobbyId],
    queryFn: async () => {
      return api.get<RouletteFairnessHistoryData[], RouletteFairnessHistoryData[]>(
        `/roulette/${lobbyId}/fairness/history`,
      );
    },
    select,
  });

export const useRouletteProvablyFairHistory = <T = RouletteFairnessHistoryData[]>(
  lobbyId?: string,
  select?: (fairness: RouletteFairnessHistoryData[]) => T,
) => {
  return useQuery(qo_getRouletteProvablyFairHistory(lobbyId, select));
};

/**
 * Query options for aggregated lobby bets
 * This query is managed via socket events and doesn't need an API endpoint
 */
export const qo_getLobbyAggregatedBets = <T = RouletteAggregatedBet[]>(
  lobbyId: string,
  select?: (bets: RouletteAggregatedBet[]) => T,
) =>
  queryOptions<RouletteAggregatedBet[], Error, T>({
    queryKey: ['roulette', 'lobby', 'bets', lobbyId],
    queryFn: async () => {
      // This query is populated by socket events, not API calls
      // Return empty array as initial state
      return [];
    },
    enabled: Boolean(lobbyId),
    staleTime: Infinity, // Never auto-refetch, only update via socket events
    select,
  });

export const useLobbyAggregatedBets = <T = RouletteAggregatedBet[]>(
  lobbyId: string,
  select?: (bets: RouletteAggregatedBet[]) => T,
) => {
  return useQuery(qo_getLobbyAggregatedBets(lobbyId, select));
};
