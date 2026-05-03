import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '../lib/interaction/api';
import { useCredentials } from './auth';

export type UserData = {
  id: string;
  username: string;
  balance: number;
  email: string;
  createdAt: string;
  intercomHash?: string;
};

export const qo_getUser = (enabled?: boolean) =>
  queryOptions({
    queryKey: ['user', 'details'],
    queryFn: async () => {
      return api.get<UserData, UserData>('/user');
    },
    enabled,
  });

export const useUser = () => {
  const { data: credentials } = useCredentials();
  return useQuery(qo_getUser(!!credentials?.user));
};
