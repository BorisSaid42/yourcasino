import { createContext } from 'react';

export type SocketLockContextType = {
  isLocked: (key: string) => boolean;
  setLock: (key: string, val: boolean) => void;
};

const DEFAULT_CONTEXT: SocketLockContextType = {
  isLocked: () => false,
  setLock: () => void 0,
};

export const SocketLockContext = createContext(DEFAULT_CONTEXT);
