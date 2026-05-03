import { createContext } from 'react';
import { AuthModalOpened } from '../../components/modals/auth/auth-modal.enum';
import { IPaymentMethod } from '../../lib/payment-methods';
import { FairnessVerificationResponse } from '../../queries/fairness';
import { EditLobbyData, LobbyGame } from '../../queries/lobby';

export type ModalKey =
  | 'create-lobby'
  | 'edit-lobby'
  | 'join-lobby'
  | 'auth'
  | 'profile-stats'
  | 'transactions'
  | 'bet-history'
  | 'lobby-deactivated'
  | 'manage-tables'
  | 'balance-modal'
  | 'bankroll-insufficient-funds'
  | 'blackjack-fairness-history-modal'
  | 'roulette-fairness-history-modal'
  | 'closing-lobby-confirmation-modal'
  | 'closing-game-confirmation-modal'
  | 'fairness-verification-data'
  | 'max-win-notice'
  | 'add-bankroll-funds'
  | 'forgot-password-modal'
  | 'reset-password-modal'
  | 'roulette-fairness-modal'
  | 'change-username-modal'
  | 'maintenance-paused';

export type ModalPropsByKey = {
  'create-lobby': {};
  'edit-lobby': { lobbyId: string; game?: LobbyGame; choice?: 'accept' | 'cancel'; currentValues?: EditLobbyData };
  'join-lobby': {};
  'lobby-deactivated': { code: string };
  'roulette-fairness-modal': { gameId: string };
  'blackjack-fairness-history-modal': { lobbyId: string };
  'roulette-fairness-history-modal': { lobbyId: string };
  'closing-lobby-confirmation-modal': { code: string };
  'closing-game-confirmation-modal': { code: string; game: LobbyGame; currentValues?: EditLobbyData };
  'profile-stats': {};
  'bet-history': {};
  'manage-tables': {};
  'fairness-verification-data': { fairnessData: FairnessVerificationResponse };
  'bankroll-insufficient-funds': {
    code: string;
    game: LobbyGame;
    canPlayRoulette?: boolean;
    canPlayBlackjack?: boolean;
  };
  'add-bankroll-funds': { code: string; game: 'blackjack' | 'roulette' };
  'balance-modal': { method?: IPaymentMethod; type: 'deposit' | 'withdraw' };
  'max-win-notice': { lobbyId: string; userId: string; gameId: string };
  transactions: {};
  auth: { tab: AuthModalOpened };
  'forgot-password-modal': {};
  'reset-password-modal': {};
  'change-username-modal': {};
  'maintenance-paused': {};
};

export type ModalProps<TKey extends ModalKey> = TKey extends ModalKey ? ModalPropsByKey[TKey] : never;

export type ModalOptions<TKey extends ModalKey> = {
  [K in ModalKey]: {
    key: K;
    props: ModalProps<K>;
    onClose?: () => void;
    closable?: boolean;
    lightBlur?: boolean;
  };
}[TKey];

export interface IModalContext {
  currentConfig: ModalOptions<ModalKey> | null;
  openModal: <TKey extends ModalKey>(options: ModalOptions<TKey>) => void;
  replaceModal: <TKey extends ModalKey, TOldKey extends ModalKey>(
    setter: (prevOptions: ModalOptions<TOldKey>) => ModalOptions<TKey>,
  ) => void;
  closeModal: (skipCallbacks?: boolean) => void;
}

const defaultModalContext: IModalContext = {
  currentConfig: null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  openModal: (_) => void 0,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  replaceModal: (_) => void 0,
  closeModal: () => void 0,
};

export const ModalContext = createContext<IModalContext>(defaultModalContext);
