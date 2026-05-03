import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '../lib/interaction/api';
import { LobbyType } from './lobby';

export enum BlackjackGameStatus {
  WAITING_PLAYERS = 'waiting_players',
  WAITING_BETS = 'waiting_bets',
  COUNTDOWN = 'countdown',
  DEALING = 'dealing',
  PLAYING = 'playing',
  DEALER_PLAYING = 'dealer_playing',
  RESOLVING_BETS = 'resolving_bets',
  RESOLVING_USER_PAYOUTS = 'resolving_user_payouts',
  FINISHED = 'finished',
}

export type BlackjackGame = {
  id: string;
  status: BlackjackGameStatus;
  currentPlayerId: string;
  lobby: LobbyType;
  lobbyId: string;
  bets: BlackjackGameBet[];
  insuranceTimerActive?: boolean;
  dealerHand: string[];
  dealerHandTotal: number;
  deckCount: number;
  players: Player[];
  timerDeadline: Date;
  timerType: string;
};

export type Player = {
  id: string;
  userId: string;
  username: string;
  seatIndex: number;
  currentHandId: string;
  insured: boolean;
  bets: BlackjackGameBet[];
  hands: BlackjackHand[];
};

export type BlackjackHand = {
  id: string;
  hand: string[];
  handTotal: number;
  hasStood: boolean;
  isBusted: boolean;
  hasSplitted: boolean;
  hasDoubled: boolean;
  handIndex: number;
  isDoubledRevealed: boolean;
};

export type BlackjackGameBet = {
  id: string;
  userId: string;
  amount: number;
  wonAmount: number;
  betPlace: string;
  payoutResult: string;
};

export const qo_getBlackjackCurrentGame = <T = BlackjackGame>(lobbyId?: string, select?: (game: BlackjackGame) => T) =>
  queryOptions<BlackjackGame, Error, T>({
    queryKey: ['blackjack', 'game', 'current', lobbyId],
    queryFn: async () => {
      return api.get<BlackjackGame, BlackjackGame>(`/blackjack/${lobbyId}/current`);
    },
    select,
    enabled: !!lobbyId,
  });

export const useCurrentGame = <T = BlackjackGame>(lobbyId?: string, select?: (game: BlackjackGame) => T) => {
  return useQuery(qo_getBlackjackCurrentGame(lobbyId, select));
};

export type BlackjackFairnessHistoryData = {
  id: string;
  serverSeed: string;
  fairnessRandom: string;
  deck: string[];
  fullDeck: string[];
  numOfDecks: number;
  updatedAt: Date;
};

export const qo_getBlackjackProvablyFairHistory = <T = BlackjackFairnessHistoryData[]>(
  lobbyId?: string,
  select?: (fairness: BlackjackFairnessHistoryData[]) => T,
) =>
  queryOptions<BlackjackFairnessHistoryData[], Error, T>({
    queryKey: ['blackjack', 'fairness', 'history', lobbyId],
    queryFn: async () => {
      return api.get<BlackjackFairnessHistoryData[], BlackjackFairnessHistoryData[]>(
        `/blackjack/${lobbyId}/fairness/history`,
      );
    },
    select,
  });

export const useBlackjackProvablyFairHistory = <T = BlackjackFairnessHistoryData[]>(
  lobbyId?: string,
  select?: (fairness: BlackjackFairnessHistoryData[]) => T,
) => {
  return useQuery(qo_getBlackjackProvablyFairHistory(lobbyId, select));
};
