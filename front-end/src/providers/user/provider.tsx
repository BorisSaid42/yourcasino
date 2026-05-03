import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sockets } from '../../lib/interaction/sockets';
import { UserData, useUser } from '../../queries/user';
import { UserContext, UserContextType } from './context';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { data: fetchedUser } = useUser();
  const [user, setUser] = useState<UserData | null>(null);
  const latestBalanceRef = useRef<number | null>(null);

  useEffect(() => {
    if (fetchedUser) {
      setUser(fetchedUser);
    }
  }, [fetchedUser]);

  useEffect(() => {
    const onBalanceChange = (data: { userId: string; balance: number }) => {
      if (!user || data.userId !== user.id) return;

      latestBalanceRef.current = data.balance;

      setTimeout(() => {
        if (latestBalanceRef.current === data.balance) {
          setUser((prev) => (prev ? { ...prev, balance: data.balance } : prev));
          queryClient.setQueryData<UserData>(['user', 'details'], (old) =>
            old ? { ...old, balance: data.balance } : old,
          );
        }
      }, 500);
    };

    sockets.on('user:balance', onBalanceChange);
    return () => {
      sockets.off('user:balance', onBalanceChange);
    };
  }, [user, queryClient]);

  const updateUser = useCallback(
    (partial: Partial<UserData>) => {
      setUser((prev) => (prev ? { ...prev, ...partial } : prev));
      queryClient.setQueryData<UserData>(['user', 'details'], (old) => (old ? { ...old, ...partial } : old));
    },
    [queryClient],
  );

  const value = useMemo<UserContextType>(() => ({ user, updateUser }), [updateUser, user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
