import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/interaction/api';
import { LobbyState } from './lobby';

export type Bet = {
  gameId: string;
  status: LobbyState;
  lobbyCode: string;
  inviteLink: string;
  totalBet: number;
  totalWon: number;
  createdAt: string;
};

export type BetHistoryResponse = {
  data: Bet[];
  total: number;
  page: number;
  totalPages: number;
};

export const useBetHistory = (page: number) => {
  return useQuery({
    queryKey: ['blackjack', 'bet', 'history', page],
    queryFn: async () =>
      await api.get<BetHistoryResponse, BetHistoryResponse>('/blackjack/player/bets/history', {
        params: { page, limit: 10 },
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

export const useRouletteBetHistory = (page: number) => {
  return useQuery({
    queryKey: ['roulette', 'bet', 'history', page],
    queryFn: async () =>
      await api.get<BetHistoryResponse, BetHistoryResponse>('/roulette/user/bets/history', {
        params: { page, limit: 10 },
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};
