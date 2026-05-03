import { Link, useLocation, useMatch, useParams } from '@tanstack/react-router';
import { use, useCallback, useState } from 'react';
import aceIconGray from '../../assets/icons/common/ace-icon-gray.svg';
import aceIcon from '../../assets/icons/common/ace-icon.svg';
import dollarSign from '../../assets/icons/dollar-sign.svg';
import walletIcon from '../../assets/icons/wallet-icon-new.svg';
import rouletteIconGray from '../../assets/roulette/roulette-icon-gray.svg';
import rouletteIcon from '../../assets/roulette/roulette-icon.svg';
import logo from '../../assets/your-casino-logo.svg';
import { BreakpointEnum, classNames, formatBalance, useBreakpoint } from '../../lib/utils';
import { ModalContext } from '../../providers/modal/context';
import { NotificationsProvider } from '../../providers/notifications/provider';
import { useLobbyData } from '../../queries/lobby';
import { useUser } from '../../queries/user';
import { GenericButton } from '../common/buttons';
import { Dropdown } from '../form/inputs/dropdown';
import { AuthModalOpened } from '../modals/auth/auth-modal.enum';
import { NotificationsDropdown } from '../notifications/notifications-dropdown';
import { NotificationsButton } from './notifications-button';
import { UserMenu } from './user-menu';

export const NavBar = () => {
  const { data: user } = useUser();
  const params = useParams({ strict: false });
  const { openModal } = use(ModalContext);
  const isSmallerScreen = useBreakpoint(BreakpointEnum.MD);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const blackjackMatch = useMatch({ from: '/lobby/$code/blackjack', shouldThrow: false });
  const rouletteMatch = useMatch({ from: '/lobby/$code/roulette', shouldThrow: false });
  const inLobby = Boolean(params.code);
  const isSmallestScreen = useBreakpoint(BreakpointEnum.XXS);

  const location = useLocation();

  const { data: lobby } = useLobbyData(params.code);

  const handleOpenLoginModal = useCallback(() => {
    openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
  }, [openModal]);

  const handleOpenRegisterModal = useCallback(() => {
    openModal({ key: 'auth', props: { tab: AuthModalOpened.REGISTER }, closable: true });
  }, [openModal]);

  const handleOpenBalanceModal = useCallback(() => {
    openModal({ key: 'balance-modal', props: { type: 'deposit' }, closable: true });
  }, [openModal]);

  const toggleDropdown = useCallback(() => setShowNotificationDropdown((prevState) => !prevState), []);

  return (
    <nav
      className={classNames(
        'fixed top-0 left-0 z-[100] flex h-[68px] w-full gap-8 bg-[#152947] bg-cover bg-left-top bg-no-repeat px-[18px] max-lg:gap-4 max-md:h-[68px] lg:relative',
      )}
    >
      <div className="mx-auto flex w-full max-w-[1200px] shrink-[10] items-center justify-between">
        <div className={classNames('flex w-[30%] items-center gap-12', isSmallestScreen && 'max-w-[50px]')}>
          {location.pathname === '/maintenance' ? (
            <>
              {isSmallerScreen ? (
                <img className="" src={aceIcon} alt="YOURCASINO" />
              ) : (
                <img className="w-[130px] max-lg:ml-4 max-md:hidden" src={logo} alt="YOURCASINO" />
              )}
            </>
          ) : (
            <Link to="/" className="flex justify-start select-none">
              {isSmallerScreen ? (
                <img className="" src={aceIcon} alt="YOURCASINO" />
              ) : (
                <img className="w-[130px] max-lg:ml-4 max-md:hidden" src={logo} alt="YOURCASINO" />
              )}
            </Link>
          )}
          {inLobby && params.code && (
            <div className="flex h-full items-center gap-7 max-xl:hidden">
              {lobby && lobby.isBlackjackEnabled && (
                <Link
                  activeOptions={{ exact: true }}
                  params={{ code: params.code }}
                  className={classNames('relative h-7 cursor-pointer', !blackjackMatch ? 'opacity-50 select-none' : '')}
                  activeProps={{
                    className: `pointer-events-none`,
                  }}
                  to="/lobby/$code/blackjack"
                >
                  <div className="relative flex h-full gap-3 select-none">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex gap-2">
                        {blackjackMatch ? <img src={aceIcon} width={18} /> : <img src={aceIconGray} width={18} />}
                        <span className="text-base font-bold">Blackjack</span>
                      </div>
                      {blackjackMatch && <span className="pl-7 text-xs font-bold text-[#60A4FD]">In-Game</span>}
                    </div>
                    {blackjackMatch && <div className="absolute -bottom-[22px] h-[2px] w-full bg-[#60A4FD]"></div>}
                  </div>
                </Link>
              )}
              {lobby && lobby.isRouletteEnabled && (
                <Link
                  activeOptions={{ exact: true }}
                  params={{ code: params.code }}
                  className={classNames('relative h-7 cursor-pointer', !rouletteMatch ? 'opacity-50 select-none' : '')}
                  activeProps={{
                    className: `pointer-events-none `,
                  }}
                  to="/lobby/$code/roulette"
                >
                  <div className="relative flex h-full gap-3 select-none">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex gap-2">
                        {rouletteMatch ? (
                          <img src={rouletteIcon} width={18} />
                        ) : (
                          <img src={rouletteIconGray} width={18} />
                        )}
                        <span className="text-base font-bold">Roulette</span>
                      </div>
                      {rouletteMatch && <span className="pl-7 text-xs font-bold text-[#60A4FD]">In-Game</span>}
                    </div>
                    {rouletteMatch && <div className="absolute -bottom-[22px] h-[2px] w-full bg-[#60A4FD]"></div>}
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
        {location.pathname !== '/maintenance' && (
          <>
            {!user ? (
              <div className="flex gap-3">
                <GenericButton
                  skin="primary"
                  className="h-[40px] font-extrabold"
                  text="Sign In"
                  onClick={handleOpenLoginModal}
                />
                <GenericButton
                  skin="register"
                  className="h-[40px] font-extrabold"
                  text="Register"
                  onClick={handleOpenRegisterModal}
                />
              </div>
            ) : (
              <>
                <div
                  onClick={handleOpenBalanceModal}
                  className="nav-wallet-info flex w-[181px] cursor-pointer justify-between"
                >
                  <div className="flex items-center gap-2 py-[9px] pl-4 font-extrabold">
                    <img className="select-none" src={dollarSign} alt="dollar sign" />
                    {formatBalance(user.balance)}
                  </div>
                  <div className="bg-[#4486DD] px-3.5 py-[11px] duration-300 select-none hover:bg-[#5898E6]">
                    <img className="w-7" src={walletIcon} alt="wallet icon" />
                  </div>
                </div>
                <div className="relative flex w-[33%] items-center justify-end gap-3">
                  <Dropdown isOpen={showNotificationDropdown} onClose={() => setShowNotificationDropdown(false)}>
                    <NotificationsProvider>
                      <NotificationsButton
                        showNotificationDropdown={showNotificationDropdown}
                        toggleNotificationDropdown={toggleDropdown}
                        isOpen={showNotificationDropdown}
                      />
                    </NotificationsProvider>

                    {showNotificationDropdown && <NotificationsDropdown />}
                  </Dropdown>
                  <UserMenu />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
};
