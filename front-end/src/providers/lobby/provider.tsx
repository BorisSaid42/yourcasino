import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { sockets } from '../../lib/interaction/sockets';
import { LobbyType, useLobbyData } from '../../queries/lobby';
import { LobbyContext } from './context';

type LobbyProviderProps = {
  children: ReactNode;
  code: string;
};

export const LobbyProvider = ({ children, code }: LobbyProviderProps) => {
  const queryClient = useQueryClient();
  const { data: fetchedLobby } = useLobbyData(code);
  const [lobby, setLobby] = useState<LobbyType | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (fetchedLobby) {
      setLobby(fetchedLobby);
    }
  }, [fetchedLobby]);

  useEffect(() => {
    const onLobbyChange = (update: Partial<LobbyType>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        queryClient.setQueryData(['lobby', 'details', code.toUpperCase()], (prev: LobbyType | undefined) => {
          if (!prev) return undefined;

          return { ...prev, ...update };
        });
      }, 1000);
    };

    const onLobbyActiveStatus = (data: { lobbyId: string; code: string }) => {
      queryClient.invalidateQueries({ queryKey: ['roulette', 'game', 'current', data.lobbyId] });
      queryClient.invalidateQueries({ queryKey: ['blackjack', 'game', 'current', data.lobbyId] });
      queryClient.invalidateQueries({ queryKey: ['lobby', 'details', code.toUpperCase()] });
    };

    sockets.on('lobby:update', onLobbyChange);
    sockets.on('roulette:lobby:update', onLobbyChange);
    sockets.on('lobby:active:status', onLobbyActiveStatus);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      sockets.off('lobby:update', onLobbyChange);
      sockets.on('roulette:lobby:update', onLobbyChange);
      sockets.on('lobby:active:status', onLobbyActiveStatus);
    };
  }, [code, queryClient]);

  return <LobbyContext.Provider value={{ lobby, setLobby }}>{children}</LobbyContext.Provider>;
};
