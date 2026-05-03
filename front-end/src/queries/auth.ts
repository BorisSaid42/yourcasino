import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { notify } from '../components/toast';
import { formatApiErrorMessage } from '../lib/error';
import { api } from '../lib/interaction/api';
import { updateCredentials } from '../lib/interaction/credentials';
import { reloadSockets } from '../lib/interaction/sockets';

export type BaseCredentials = {
  user: string;
  balance?: number;
};

export const qo_getCredentials = <T>(select?: (credentials: BaseCredentials | null) => T) =>
  queryOptions<BaseCredentials | null, Error, T>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await api.get<BaseCredentials, BaseCredentials>('/auth/me');
      } catch {
        return null;
      }
    },
    select,
  });

export const useCredentials = () => useSuspenseQuery(qo_getCredentials<BaseCredentials>());

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  passwordRepeat?: string;
  tos: boolean;
};

export const useRegister = () => {
  return useMutation<void, Error, RegisterPayload>({
    mutationFn: async (payload) => {
      await api.post<void, void>('/auth/signup', payload);
    },
    onSuccess: () => {
      notify('success', { content: 'Please check your email to verify your account', title: 'Success' });
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const useForgetPassword = () => {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const data = await api.post('/auth/reset/password', payload);

      return data;
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const useChangeForgettenPassword = () => {
  return useMutation({
    mutationFn: async (payload: { userId: string; password: string; code: string }) => {
      const data = await api.post('/auth/change/forgoten/password', payload);

      return data;
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const useChangeUsername = () => {
  return useMutation({
    mutationFn: async (payload: { newUsername: string }) => {
      return api.put('/auth/change/username', payload);
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const useGoogleLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseCredentials & { jwt: string }, Error, { code: string }>({
    mutationFn: async ({ code }) => {
      const data = await api.post<BaseCredentials & { jwt: string }, BaseCredentials & { jwt: string }>(
        '/auth/login/google',
        { code },
      );

      const { jwt, ...credentials } = data;
      updateCredentials(jwt);
      reloadSockets();
      queryClient.setQueryData(['auth', 'me'], credentials);
      return data;
    },
  });
};

export type LoginPayload = {
  usernameOrEmail: string;
  password?: string;
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseCredentials & { jwt: string }, Error, LoginPayload>({
    mutationFn: async (payload) => {
      const data = await api.post<BaseCredentials & { jwt: string }, BaseCredentials & { jwt: string }>(
        '/auth/login',
        payload,
      );

      const { jwt, ...credentials } = data;
      updateCredentials(jwt);
      reloadSockets();
      queryClient.setQueryData(['auth', 'me'], credentials);

      return data;
    },
    onError: (error) => {
      notify('error', { content: formatApiErrorMessage(error), title: 'Error' });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      updateCredentials(null);
      reloadSockets();
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.setQueryData(['user', 'details'], null);
      queryClient.invalidateQueries();
    },
    onSuccess: () => {
      navigate({ to: '/' });
    },
  });
};
