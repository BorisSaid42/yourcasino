import { ReactNode } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { SocketLockContext, SocketLockContextType } from './context';

export const SocketLockProvider = ({ children }: { children: ReactNode }) => {
  const [lockState, setLockState] = useState<{ [key: string]: boolean }>({});

  const isLocked = useCallback((key: string) => !!lockState[key], [lockState]);
  const setLock = useCallback((key: string, val: boolean) => {
    setLockState((prev) => ({ ...prev, [key]: val }));
  }, []);

  const value = useMemo<SocketLockContextType>(() => ({ isLocked, setLock }), [isLocked, setLock]);

  return <SocketLockContext.Provider value={value}>{children}</SocketLockContext.Provider>;
};
