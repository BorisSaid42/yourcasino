import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/interaction/api';
import { NotificationTypeEnum } from '../providers/notifications/context';

export type Notification = {
  id: string;
  message: string;
  title: string;
  amount: string; // bigint
  type: NotificationTypeEnum;
  link?: string;
  createdAt: string; // date string
};

export const useGetUserNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return api.get<Notification[], Notification[]>(`notification/unread`);
    },
  });

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error>({
    mutationFn: async () => {
      const data = await api.post<void, void>(`/notification/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], () => []);
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (notificationId) => {
      const data = await api.post<void, void>(`/notification/read/${notificationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
