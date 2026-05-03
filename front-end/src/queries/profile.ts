import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/interaction/api';

export type ProfileStats = {
  username: string;
  wagered: number;
  netProfit: number;
  totalBets: number;
  totalLobbies: number;
  createdAt: Date;
};

export const useProfileStats = (userId: string) => {
  return useQuery({
    queryKey: ['profile', 'stats', userId],
    queryFn: async () => await api.get<ProfileStats, ProfileStats>('/user/profile/stats'),
    staleTime: 5_000,
  });
};

export const useResetProfileStats = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/user/profile/reset-stats');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'stats', userId] });
    },
  });
};
