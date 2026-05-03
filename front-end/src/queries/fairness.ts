import { useMutation } from '@tanstack/react-query';
import { notify } from '../components/toast';
import { formatApiErrorMessage } from '../lib/error';
import { api } from '../lib/interaction/api';

export enum FairnessGameType {
  BLACKJACK = 'blackjack',
  ROULETTE = 'roulette',
}

export type VerifyFairnessData = {
  serverSeed: string;
  fairnessRandom: string;
  game?: FairnessGameType;
  numOfDecks: number | undefined;
};

export type FairnessVerificationResponse = {
  game: FairnessGameType;
  serverSeed: string;
  fairnessRandom: string;
  result: number | string[];
};

export const useVerifyFairness = () => {
  return useMutation<FairnessVerificationResponse, Error, VerifyFairnessData>({
    mutationFn: async (payload) => {
      return await api.post<FairnessVerificationResponse, FairnessVerificationResponse>(
        `/${payload.game}/fairness/verify`,
        {
          serverSeed: payload.serverSeed,
          fairnessRandom: payload.fairnessRandom,
          numOfDecks: payload.numOfDecks,
        },
      );
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};
