import { createContext, useContext } from 'react';
import { LobbyType } from '../../queries/lobby';

type LobbyContextValue = {
  lobby: LobbyType | null;
  setLobby: (lobby: LobbyType | null) => void;
};

export const LobbyContext = createContext<LobbyContextValue>({
  lobby: null,
  setLobby: () => {},
});

export function useLobby() {
  const ctx = useContext(LobbyContext);
  if (!ctx) {
    throw new Error('useLobby must be used within a LobbyProvider');
  }
  return ctx;
}
