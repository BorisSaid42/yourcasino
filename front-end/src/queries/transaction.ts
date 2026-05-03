import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/interaction/api';

export enum UserTransactionStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  DECLINED = 'declined',
  DECLINED_WITHOUT_REFUND = 'declined_without_refund',
  FAILED = 'failed',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export type UserTransaction = {
  id: string;
  symbol: string;
  amount: number;
  status: string;
  txHash: string;
  externalStatus: string;
  createdAt: string;
};

export type UserTransactionHistory = {
  data: UserTransaction[];
  total: number;
  page: number;
  totalPages: number;
};

export const useTransactionHistory = (page: number, type: string) => {
  return useQuery({
    queryKey: ['transaction', 'history', page, type],
    queryFn: async () =>
      await api.get<UserTransactionHistory, UserTransactionHistory>('/transaction/history', {
        params: { page, limit: 10, type },
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

export const useCancelWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      return await api.post<{ message: string }, { message: string }>('/transaction/cancel', {
        transactionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', 'history'] });
    },
  });
};
