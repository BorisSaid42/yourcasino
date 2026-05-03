/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InfiniteData,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { notify } from '../components/toast';
import { formatApiErrorMessage } from '../lib/error';
import { api } from '../lib/interaction/api';

export type LobbyData = {
  isBlackjackSelected: boolean;
  bankroll?: number | undefined;
  minBet?: number | undefined;
  maxBet?: number | undefined;
  code: string;
  inviteLink: string;
  isPrivate: boolean;
  sideBets: boolean;
  isRouletteSelected: boolean;
  rouletteBankroll?: number | undefined;
  rouletteMinBet?: number | undefined;
  rouletteMaxBet?: number | undefined;
  tos: boolean;
};

export type LobbyPayload = Omit<LobbyData, 'inviteLink'>;

export interface ICreateLobbyResponse {
  id: string;
  code: string;
  inviteLink: string;
  bankroll: number;
  minBet: number;
  maxBet: number;
  rouletteBankroll: number;
  rouletteMinBet: number;
  rouletteMaxBet: number;
  isPrivate: boolean;
  sideBets: boolean;
  name: string;
  currentPlayerCount: number;
  createdAt: string;
  updatedAt: string;
}

export const useCreateLobby = () => {
  const queryClient = useQueryClient();

  return useMutation<ICreateLobbyResponse, Error, LobbyPayload>({
    mutationFn: async (payload) => {
      return api.post<ICreateLobbyResponse, ICreateLobbyResponse>('/lobby/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lobby', 'list'] });
      notify('success', { content: 'Successfully added lobby', title: 'Success' });
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export type EditLobbyData = {
  bankroll?: number | undefined;
  minBet?: number | undefined;
  maxBet?: number | undefined;
  rouletteBankroll?: number | undefined;
  rouletteMinBet?: number | undefined;
  rouletteMaxBet?: number | undefined;
  isPrivate: boolean;
  sideBets: boolean;
  isRouletteSelected: boolean;
  isBlackjackSelected: boolean;
  status: LobbyState;
};

export const useUpdateLobby = (lobbyId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, EditLobbyData>({
    mutationFn: async (payload) => {
      await api.put<LobbyData, LobbyData>(`/lobby/${lobbyId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lobby', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['lobby', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['lobby', 'details', lobbyId] });
      notify('success', { content: 'Changes saved successfully', title: 'Lobby changed' });
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export enum AddBankrollActionEnum {
  ADD = 'add',
  WITHDRAW = 'withdraw',
}

export type AddBankrollData = {
  bankroll: number;
  game: 'blackjack' | 'roulette';
  action: AddBankrollActionEnum;
};

export const useAddBankroll = (lobbyId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, AddBankrollData>({
    mutationFn: async (payload) => {
      await api.put<LobbyData, LobbyData>(`/lobby/bankroll/${lobbyId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lobby', 'details', lobbyId] });
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const useDeactivateLobby = (page?: number) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (lobbyId: string) => {
      await api.put(`/lobby/deactivate/${lobbyId}`);
    },
    onSuccess: () => {
      if (page) {
        queryClient.invalidateQueries({ queryKey: ['lobby', 'stats', page] });
      }
      notify('success', {
        content:
          'Successfully deactivated. If game is in progress deactivation will take place after the game is finished',
        title: 'Lobby deactivation',
      });
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const useDeactivateGame = () => {
  return useMutation<void, Error, { lobbyId: string; game: LobbyGame }>({
    mutationFn: async ({ lobbyId, game }) => {
      await api.put(`/lobby/game/deactivate/${lobbyId}`, { game });
    },
    onSuccess: () => {
      notify('success', {
        content:
          'Successfully deactivated game. If game is in progress deactivation will take place after the game is finished',
        title: 'Lobby deactivation',
      });
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const usePauseLobby = (page?: number) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (lobbyId: string) => {
      await api.put(`/lobby/pause/${lobbyId}`);
    },
    onSuccess: () => {
      if (page) {
        queryClient.invalidateQueries({ queryKey: ['lobby', 'stats', page] });
      }
      notify('success', {
        content: 'Successfully paused. If game is in progress deactivation will take place after the game is finished',
        title: 'Lobby deactivation',
      });
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const useActivateLobby = (page?: number) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (lobbyId: string) => {
      await api.put(`/lobby/activate/${lobbyId}`);
    },
    onSuccess: () => {
      if (page) {
        queryClient.invalidateQueries({ queryKey: ['lobby', 'stats', page] });
      }
      notify('success', {
        content: 'Successfully activated.',
        title: 'Lobby activation',
      });
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export enum LobbyState {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  PAUSED = 'paused',
}

export enum LobbyGame {
  BLACKJACK = 'blackjack',
  ROULETTE = 'roulette',
}

export type LobbyType = {
  id: string;
  name: string;
  isBlackjackEnabled: boolean;
  isRouletteEnabled: boolean;
  bankroll: number;
  rouletteBankroll: number;
  owner: string;
  ownerId: string;
  status: LobbyState;
  minBet: number;
  maxBet: number;
  rouletteMinBet: number;
  rouletteMaxBet: number;
  blackjackProfitAmount: number;
  rouletteProfitAmount: number;
  code: string;
  isPrivate: boolean;
  sideBets: boolean;
  inviteLink: string;
  createdAt: string;
  currentPlayerCount: number;
  roulettePlayerCount: number;
  summedBankroll: number;
};

export type LobbyListData = {
  data: LobbyType[];
  total: number;
  totalPrivate: number;
};

type LobbyCursor = {
  sort: string | number;
  id: string;
};

export enum LobbySortField {
  CREATED_AT = 'createdAt',
  BANKROLL = 'bankroll',
  MIN_BET = 'minBet',
  MAX_BET = 'maxBet',
}

export enum LobbyFilterField {
  OPEN_SLOTS = 'openSlots',
  ALL_GAMES = 'allGames',
  BLACKJACK_ONLY = 'blackjackOnly',
  ROULETTE_ONLY = 'rouletteOnly',
}

export const useLobbyList = (
  sort: LobbySortField = LobbySortField.CREATED_AT,
  limit: number = 10,
  search = '',
  filter?: LobbyFilterField[] | undefined,
) =>
  useInfiniteQuery<LobbyListData, Error, InfiniteData<LobbyListData>, any, LobbyCursor | undefined>({
    queryKey: ['lobby', 'list', sort, search, filter],
    queryFn: async ({ pageParam }) => {
      const response = await api.get<LobbyListData, LobbyListData>('/lobby', {
        params: {
          sort,
          limit,
          search,
          cursor: pageParam?.sort,
          cursorId: pageParam?.id,
          filter,
        },
      });

      return response;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      const lastItem = lastPage.data?.length ? lastPage?.data[lastPage.data?.length - 1] : undefined;
      return lastItem
        ? {
            sort: lastItem[sort as keyof typeof lastItem] as string | number,
            id: lastItem.id,
          }
        : undefined;
    },
  });

export const qo_getLobby = (code?: string) =>
  queryOptions<LobbyType>({
    queryKey: ['lobby', 'details', code?.toUpperCase()],
    queryFn: () => api.get<LobbyType, LobbyType>(`/lobby/${code}`),
    enabled: !!code,
  });

export const useLobbyData = (code?: string) => {
  return useQuery(qo_getLobby(code));
};

export const qo_getLobbyById = (id: string) =>
  queryOptions<LobbyType>({
    queryKey: ['lobby', 'details', id],
    queryFn: () => api.get<LobbyType, LobbyType>(`/lobby/id/${id}`),
  });

export const useLobbyDataById = (id: string) => {
  return useQuery(qo_getLobbyById(id));
};

export type LobbyStats = {
  id: string;
  status: LobbyState;
  name: string;
  code: string;
  inviteLink: string;
  minBet: number;
  maxBet: number;
  bankroll: number;
  netProfit: number;
  profitPercentage: number;
};

export type LobbyStatsResponse = {
  data: LobbyStats[];
  total: number;
  page: number;
  totalPages: number;
};

export const useLobbyStats = (page: number) => {
  return useQuery({
    queryKey: ['lobby', 'stats', page],
    queryFn: async () =>
      await api.get<LobbyStatsResponse, LobbyStatsResponse>('/lobby/manage/stats', {
        params: { page, limit: 8 },
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

export type LobbyStatistics = {
  id: string;
  gameStats: GameStatistic[];
  netProfit: number;
  wagered: number;
  totalBets: number;
  activatedAt: Date;
};

export type GameStatistic = {
  name: string;
  value: number;
};

export const useLobbyStatistics = (lobbyId: string, game: 'blackjack' | 'roulette') => {
  return useQuery({
    queryKey: ['lobby', 'stats', lobbyId, game],
    queryFn: async () => await api.get<LobbyStatistics, LobbyStatistics>(`/${game}/stats/${lobbyId}`),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};
