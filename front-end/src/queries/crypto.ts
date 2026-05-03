import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '../components/toast';
import { formatApiErrorMessage } from '../lib/error';
import { api } from '../lib/interaction/api';

export type WithdrawData = {
  withdrawAmount: number;
  withdrawAmountUsd: number;
  walletAddress: string;
  asset: string;
};

export const useWithdrawCrypto = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, WithdrawData>({
    mutationFn: async (payload) => {
      await api.post<void, void>('/fireblocks/withdraw', {
        walletAddress: payload.walletAddress,
        withdrawAmountUsd: +payload.withdrawAmountUsd,
        asset: payload.asset,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'details'] });
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const qo_getEstimateTxFee = (asset: string) =>
  queryOptions<number>({
    queryKey: ['crypto', 'assets', 'fee', asset],
    queryFn: () => api.get<number, number>(`/fireblocks/estimate-fee/${asset}`),
  });

export const useEstimateTxFee = (asset: string) => {
  return useQuery(qo_getEstimateTxFee(asset));
};

export type AssetPrice = {
  asset: string;
  price: number;
};

export const qo_getAssetPrices = () =>
  queryOptions<AssetPrice[]>({
    queryKey: ['crypto', 'assets', 'prices'],
    queryFn: () => api.get<AssetPrice[], AssetPrice[]>(`/fireblocks/assets`),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });

export const useAssetPricesData = () => {
  return useQuery(qo_getAssetPrices());
};

export const qo_getAssetDepositAddress = (asset: string) =>
  queryOptions<string>({
    queryKey: ['asset', 'deposit', 'address', asset],
    queryFn: () => api.get<string, string>(`/fireblocks/deposit/${asset}`),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export const useAssetDepositAddress = (asset: string) => {
  return useQuery(qo_getAssetDepositAddress(asset));
};
