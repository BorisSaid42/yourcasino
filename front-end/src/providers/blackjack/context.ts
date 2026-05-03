// src/providers/blackjack/context.tsx
import { createContext, useContext } from 'react';
import { LobbyType } from '../../queries/lobby';
import { BlackjackGame } from '../../queries/blackjack';
import { ModalKey, ModalOptions } from '../modal/context';

export type BlackjackContextType = {
  isBlackjackMaxWinWarning: boolean;
  selectedBetAmount: number | null;
  handleChangeBetAmount: (newBetAmount: number) => void;
  onPlaceBet: (betPlace: string, lobby: LobbyType, currentGame: BlackjackGame) => void;
  handleJoinSeat: (
    seatIndex: number,
    openModal: (options: ModalOptions<ModalKey>) => void,
    lobby: LobbyType,
    currentGame: BlackjackGame,
  ) => void;
  handleLeaveSeat: (seatIndex: number, lobbyId: string) => void;
};

export const BlackjackContext = createContext<BlackjackContextType | null>(null);

export function useBlackjack() {
  const ctx = useContext(BlackjackContext);
  if (!ctx) {
    throw new Error('useBlackjack must be used within a BlackjackProvider');
  }
  return ctx;
}
