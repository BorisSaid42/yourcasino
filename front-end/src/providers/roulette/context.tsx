import { createContext, useContext } from 'react';
import { RoulleteBetMapObject } from './provider';
import { RouletteGameStatus } from '../../queries/roulette';

export type RouletteContextType = {
  currentLobbyId: string;
  isRouletteMaxWinWarning: boolean;
  handleChangeCurrentLobbyId: (lobbyId: string) => void;
  selectedChipAmount: number;
  handleChangeSelectedChipAmount: (newAmount: number) => void;
  rouletteBetsMap: RoulleteBetMapObject | null;
  handleRouletteBet: (field: string, value: number, operation?: '-' | '+') => void;
  rouletteGameStatus: RouletteGameStatus | undefined;
  handleSetGameStatus: (newStatus: RouletteGameStatus) => void;
  handleSetLastBetsMap: () => void;
  lastBetsMap: RoulleteBetMapObject | null;
  handleRebet: () => void;
  handleClearBet: () => void;
};

export const RouletteContext = createContext<RouletteContextType | null>(null);

export function useRoulette() {
  const ctx = useContext(RouletteContext);
  if (!ctx) {
    throw new Error('useRoulette must be used within a RouletteProvider');
  }
  return ctx;
}
