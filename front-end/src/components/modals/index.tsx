import { use } from 'react';
import { ModalContext } from '../../providers/modal/context';
import { AuthModal } from './auth';
import { BalanceModal } from './balance-modal/balance-modal-wrapper';
import { BankrollFundsModal } from './bankroll-funds-modal';
import { BankrollInsufficientModal } from './bankroll-insufficient-modal';
import { ModalBase } from './base';
import { BetHistoryModal } from './bet-history-modal';
import { CreateLobbyModal } from './create-lobby';
import { EditLobbyModal } from './edit-lobby';
import { ForgotPasswordModal } from './forgot-password/forgot-password-modal';
import { JoinLobbyModal } from './join-lobby';
import { LobbyDeactivatedModal } from './lobby-deactivated-modal';
import { ManageTablesModal } from './manage-tables/manage-tables-modal';
import { MaxWinNoticeModal } from './max-win-notice-modal';
import { ProfileStatsModal } from './profile-stats/profile-stats-modal';
import { ResetPasswordModal } from './reset-password/reset-password-modal';
import { TransactionsModal } from './transactions-modal/transactions-modal';
import { ChangeUsernameModal } from './change-username/change-username-modal';
import { RouletteProvablyFairModal } from './provably-fair/roulette-fairness-info-modal';
import { BlackjackFairnessHistoryModal } from './provably-fair/blackjack-history-fairness';
import { ClosingLobbyConfirmation } from './closing-lobby-confirmation';
import { FairnessVerificationDataModal } from './fairness/fairness-data-modal';
import { RouletteFairnessHistoryModal } from './provably-fair/roulette-history-fairness';
import { ClosingGameConfirmation } from './closing-game-confirmation';
import { MaintenancePausedModal } from './maintenance/paused-modal';

export const Modals = () => {
  const { currentConfig } = use(ModalContext);

  return (
    <ModalBase>
      {currentConfig?.key === 'create-lobby' && <CreateLobbyModal />}
      {currentConfig?.key === 'edit-lobby' && <EditLobbyModal {...currentConfig.props} />}
      {currentConfig?.key === 'join-lobby' && <JoinLobbyModal />}
      {currentConfig?.key === 'lobby-deactivated' && <LobbyDeactivatedModal {...currentConfig.props} />}
      {currentConfig?.key === 'auth' && <AuthModal {...currentConfig.props} />}
      {currentConfig?.key === 'roulette-fairness-modal' && <RouletteProvablyFairModal {...currentConfig.props} />}
      {currentConfig?.key === 'blackjack-fairness-history-modal' && (
        <BlackjackFairnessHistoryModal {...currentConfig.props} />
      )}
      {currentConfig?.key === 'roulette-fairness-history-modal' && (
        <RouletteFairnessHistoryModal {...currentConfig.props} />
      )}
      {currentConfig?.key === 'closing-lobby-confirmation-modal' && (
        <ClosingLobbyConfirmation {...currentConfig.props} />
      )}
      {currentConfig?.key === 'closing-game-confirmation-modal' && <ClosingGameConfirmation {...currentConfig.props} />}
      {currentConfig?.key === 'profile-stats' && <ProfileStatsModal />}
      {currentConfig?.key === 'transactions' && <TransactionsModal />}
      {currentConfig?.key === 'bet-history' && <BetHistoryModal />}
      {currentConfig?.key === 'manage-tables' && <ManageTablesModal />}
      {currentConfig?.key === 'bankroll-insufficient-funds' && <BankrollInsufficientModal {...currentConfig.props} />}
      {currentConfig?.key === 'fairness-verification-data' && (
        <FairnessVerificationDataModal {...currentConfig.props} />
      )}
      {currentConfig?.key === 'add-bankroll-funds' && <BankrollFundsModal {...currentConfig.props} />}
      {currentConfig?.key === 'balance-modal' && <BalanceModal {...currentConfig.props} />}
      {currentConfig?.key === 'max-win-notice' && <MaxWinNoticeModal {...currentConfig.props} />}
      {currentConfig?.key === 'forgot-password-modal' && <ForgotPasswordModal />}
      {currentConfig?.key === 'reset-password-modal' && <ResetPasswordModal />}
      {currentConfig?.key === 'change-username-modal' && <ChangeUsernameModal />}
      {currentConfig?.key === 'maintenance-paused' && <MaintenancePausedModal />}
    </ModalBase>
  );
};
