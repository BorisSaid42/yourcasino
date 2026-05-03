import { Link } from '@tanstack/react-router';
import { use, useCallback, useEffect } from 'react';
import cardSymbols from '../../assets/banner-card-sign.svg';
import btnIconAdd from '../../assets/icons/btn-icon-add.svg';
import bankIcon from '../../assets/icons/common/bank-icon.svg';
import { IPaymentMethod, usePaymentMethods } from '../../lib/payment-methods';
import { BreakpointEnum, classNames, useBreakpoint } from '../../lib/utils';
import { ModalContext } from '../../providers/modal/context';
import { LobbySortField, useLobbyList } from '../../queries/lobby';
import { LOBBY_LIST_HEADERS } from '../lobby-list/lobby-list';
import { LobbyListRow } from '../lobby-list/lobby-list-row';
import { LobbyListRowMobile } from '../lobby-list/lobby-list-row-mobile';
import { useCredentials } from '../../queries/auth';
import { AuthModalOpened } from '../modals/auth/auth-modal.enum';

export const Banner = () => {
  const paymentMethods = usePaymentMethods();
  const { data } = useLobbyList(LobbySortField.BANKROLL, 5);
  const isSmallerScreen = useBreakpoint(BreakpointEnum.MD);
  const { openModal } = use(ModalContext);
  const { data: credentials } = useCredentials();

  const lobbiesData = data?.pages.flatMap((page) => page.data) ?? [];

  const calculateItemOpacity = useCallback((idx: number): string => {
    if (idx === 4) return 'opacity-[8%]';

    if (idx === 3) return 'opacity-[36%]';

    if (idx === 2) return 'opacity-[56%]';

    return 'opacity-100';
  }, []);

  const handleOpenJoinLobbyModal = useCallback(() => {
    if (!credentials) {
      openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
      return;
    }
    openModal({ key: 'join-lobby', props: {}, closable: true });
  }, [credentials, openModal]);

  const handleOpenCreateLobbyModal = useCallback(() => {
    if (!credentials) {
      openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
      return;
    }
    openModal({ key: 'create-lobby', props: {}, closable: true });
  }, [credentials, openModal]);

  const handleOpenBalanceModal = useCallback(
    (paymentMethod: IPaymentMethod) => {
      if (!credentials?.user) {
        openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
        return;
      }
      openModal({
        key: 'balance-modal',
        props: { method: paymentMethod, type: 'deposit' },
        closable: true,
      });
    },
    [credentials?.user, openModal],
  );

  useEffect(() => {
    function checkResetPasswordLocalStorage() {
      const shouldOpenResetPasswordModal = localStorage.getItem('openResetPasswordModal');
      const userId = localStorage.getItem('userId');
      const code = localStorage.getItem('code');

      if (shouldOpenResetPasswordModal && userId && code) {
        localStorage.removeItem('openResetPasswordModal');
        openModal({ key: 'reset-password-modal', props: {}, closable: true });
      } else if (shouldOpenResetPasswordModal && (!userId || !code)) {
        console.error('Reset password data not found in localStorage');
      }
    }

    checkResetPasswordLocalStorage();
  }, [openModal]);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative flex min-h-[calc(100vh)] w-full flex-col items-center">
        <div className="flex h-[364px] w-full max-w-[1396px] flex-col items-center bg-[url('/src/assets/banner-bg.png')] bg-contain bg-center bg-no-repeat pt-[91px] blur-none max-md:h-[unset]">
          <img className="max-lg:ml-4" src={cardSymbols} alt="banner sign" />
          <div className="font-hunters banner-header-gradient bg-clip-text text-[100px] max-md:text-6xl">
            Become the <span className="ml-[-15px] max-md:ml-[-8px]">Casino</span>
          </div>
          <div className="banner-text text-center max-md:px-5 max-md:text-xs">
            Host your own <span className="font-bold">BlackJack & Roulette Lobbies</span> and have your friends play
            against you
          </div>
          <div className="mt-10 flex gap-3 max-sm:w-full max-sm:flex-col max-sm:px-9">
            <div
              onClick={handleOpenCreateLobbyModal}
              className="btn-common btn-primary hover-base flex items-center gap-2 max-sm:justify-center max-sm:!py-3"
            >
              <img className="" src={btnIconAdd} alt="banner sign" />
              Create Lobby
            </div>

            <div
              onClick={handleOpenJoinLobbyModal}
              className="btn-common btn-secondary hover-base max-sm:!py-3 max-sm:text-center"
            >
              Join Lobby
            </div>
          </div>
        </div>
        <div className="banner-bottom-gradient"></div>
        {!!lobbiesData.length && (
          <div className="mb-6 flex w-full justify-center bg-[#12223B] max-md:mb-4">
            <div className="grid w-full max-w-[1200px] grid-cols-[1fr_3fr_1fr_2fr_3fr_200px_1fr] py-2 max-md:hidden">
              {LOBBY_LIST_HEADERS.map((lobbyHeader) => (
                <div
                  key={`lobby-list-header-${lobbyHeader.value}`}
                  className={`flex items-center justify-center gap-1.5 text-center text-[13px] font-extrabold ${lobbyHeader.value === 'Bankroll' ? 'text-[#60A4FD]' : 'text-[#6E88AF8F]'}`}
                >
                  {lobbyHeader.value === 'Bankroll' && <img src={bankIcon} />}
                  {lobbyHeader.value}
                </div>
              ))}
            </div>
            <div className="hidden py-2 text-sm font-extrabold text-[#6E88AF8F] max-md:block">Top Active Lobbies</div>
          </div>
        )}
        <div className="relative flex w-full flex-col items-center justify-center">
          {!!lobbiesData.length && (
            <div className={classNames('relative w-full max-w-[1200px] px-4', isSmallerScreen ? 'mb-15' : 'mb-9')}>
              {!isSmallerScreen &&
                lobbiesData
                  .slice(0, 5)
                  .map((lobbyRow, idx) => (
                    <LobbyListRow key={lobbyRow.id} lobbyRow={lobbyRow} className={calculateItemOpacity(idx)} />
                  ))}
              {isSmallerScreen &&
                lobbiesData
                  .slice(0, 5)
                  .map((lobbyRow, idx) => (
                    <LobbyListRowMobile key={lobbyRow.id} lobbyRow={lobbyRow} className={calculateItemOpacity(idx)} />
                  ))}
              {lobbiesData.length > 2 && lobbiesData.length <= 4 && (
                <Link
                  to="/lobby-list"
                  className={classNames(
                    'absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-[5px] bg-[#1D3353] px-6 py-3 font-bold text-[#6E88AF] transition-colors duration-200 hover:text-white',
                    isSmallerScreen ? 'bottom-[-42px]' : 'bottom-[-58px]',
                  )}
                >
                  View All Lobbies
                </Link>
              )}
              {lobbiesData.length > 4 && (
                <Link
                  to="/lobby-list"
                  className="absolute bottom-[28px] left-1/2 -translate-x-1/2 cursor-pointer rounded-[5px] bg-[#1D3353] px-6 py-3 font-bold text-[#6E88AF] transition-colors duration-200 hover:text-white"
                >
                  View All Lobbies
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="relative flex w-full flex-col items-center">
        <div className="relative flex w-full flex-col items-center justify-center">
          <div className="flex w-full justify-center bg-[#12223B] p-10">
            <div className="flex w-full max-w-[1200px] justify-between gap-5 max-lg:flex-col">
              <div className="flex max-w-[1200px] flex-col gap-3 max-lg:items-center max-lg:justify-center">
                <span className="text-2xl font-extrabold">Payment Methods</span>
                <span className="text-base font-medium text-[#658DC9] max-sm:text-center">
                  Use a crypto of your choice to deposit & withdraw
                </span>
              </div>
              <div className="flex items-center gap-3 max-lg:justify-center">
                {paymentMethods.map((paymentMethod, idx) => (
                  <div
                    onClick={() => handleOpenBalanceModal(paymentMethod)}
                    className="hover-base flex h-[72px] w-[100px] cursor-pointer items-center justify-center rounded-[5px] bg-[#0F1D34] max-md:h-[45px] max-md:w-[62px]"
                    key={`payment-method-${idx}`}
                  >
                    <img className="max-md:scale-75" src={paymentMethod.icon} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
