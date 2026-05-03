import { createContext, useContext } from 'react';
import { UserData } from '../../queries/user';

export type UserContextType = {
  user: UserData | null;
  updateUser: (user: Partial<UserData>) => void;
};

export const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}
