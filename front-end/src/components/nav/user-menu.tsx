import { Link } from '@tanstack/react-router';
import { use, useCallback, useMemo, useState } from 'react';
import profileIcon from '../../assets/icons/profile-icon.svg';
import betHistoryIcon from '../../assets/icons/user-menu/bet-history-icon.svg';
import manageTablesIcon from '../../assets/icons/user-menu/manage-tables-icon.svg';
import signInIcon from '../../assets/icons/user-menu/sign-out-icon.svg';
import statisticsIcon from '../../assets/icons/user-menu/statisctics-icon.svg';
import transactionsIcon from '../../assets/icons/user-menu/transactions-icon.svg';
import volumeIcon from '../../assets/icons/user-menu/volume-icon.svg';
import volumeMutedIcon from '../../assets/icons/user-menu/volume-muted-icon.svg';
import { useMedia } from '../../providers/media/context';
import { ModalContext } from '../../providers/modal/context';
import { useLogout } from '../../queries/auth';
import { Dropdown } from '../form/inputs/dropdown';

export const UserMenu = () => {
  const [isUserMenuOpened, setIsUserMenuOpened] = useState(false);
  const logout = useLogout();
  const { openModal } = use(ModalContext);
  const { isMuted, handleIsMuted } = useMedia();

  const handleLogout = useCallback(() => {
    logout.mutate(void 0);
  }, [logout]);

  const handleOpenStatsModal = useCallback(() => {
    openModal({ key: 'profile-stats', props: {}, closable: true });
  }, [openModal]);

  const handleOpenTransactionsModal = useCallback(() => {
    openModal({ key: 'transactions', props: {}, closable: true });
  }, [openModal]);

  const handleOpenBetHistoryModal = useCallback(() => {
    openModal({ key: 'bet-history', props: {}, closable: true });
  }, [openModal]);

  const handleOpenManageTablesModal = useCallback(() => {
    openModal({ key: 'manage-tables', props: {}, closable: true });
  }, [openModal]);

  const USER_PROFILE_LINKS = useMemo(
    () => [
      { label: 'Lobby Stats', icon: statisticsIcon, link: '/#', onClick: handleOpenStatsModal },
      { label: 'Transactions', icon: transactionsIcon, link: '/#', onClick: handleOpenTransactionsModal },
      { label: 'Bet History', icon: betHistoryIcon, link: '/#', onClick: handleOpenBetHistoryModal },
      { label: 'Manage Tables', icon: manageTablesIcon, link: '/#', onClick: handleOpenManageTablesModal },
      { label: 'Sign Out', icon: signInIcon, link: '#', onClick: handleLogout },
    ],
    [
      handleLogout,
      handleOpenBetHistoryModal,
      handleOpenManageTablesModal,
      handleOpenStatsModal,
      handleOpenTransactionsModal,
    ],
  );

  const handleProfileMenuToggle = useCallback(() => {
    setIsUserMenuOpened((prevState) => !prevState);
  }, []);

  return (
    <Dropdown isOpen={isUserMenuOpened} onClose={() => setIsUserMenuOpened(false)} className="relative select-none">
      <div onClick={handleProfileMenuToggle} className="nav-button">
        <img className="px-[17px] py-3" src={profileIcon} alt="profile icon" />
      </div>
      {isUserMenuOpened && (
        <>
          <div className="absolute top-[130%] right-[25%] h-0 w-0 border-r-[10px] border-b-[12px] border-l-[10px] border-r-transparent border-b-[#253C60] border-l-transparent"></div>
          <div className="absolute top-[60px] right-0 min-w-[200px] rounded-lg bg-[#253C60]">
            <div className="flex flex-col gap-6 p-4 pt-6">
              {USER_PROFILE_LINKS.map((userProfileLinkItem) => (
                <div
                  key={userProfileLinkItem.label}
                  className="cursor-pointer"
                  onClick={() => {
                    userProfileLinkItem.onClick?.();
                    setIsUserMenuOpened(false);
                  }}
                >
                  <div className="flex items-center gap-2 font-extrabold text-[#6E88AF] transition-colors duration-200 hover:text-white">
                    <div className="flex w-5 justify-center">
                      <img src={userProfileLinkItem.icon} />
                    </div>
                    {userProfileLinkItem.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-0.5 w-full bg-[#152947]"></div>
            <div
              className="flex cursor-pointer items-center gap-2 px-4 py-4 font-bold text-[#6E88AF] transition-colors duration-200 hover:text-white"
              onClick={handleIsMuted}
            >
              <img width={20} src={isMuted ? volumeMutedIcon : volumeIcon} alt="volume" />
              Sound {isMuted ? 'Off' : 'On'}
            </div>
            <div className="flex items-center justify-between rounded-br-lg rounded-bl-lg bg-[#152947] px-4 py-3 text-xs font-extrabold text-[#6E88AF]">
              <div>
                <Link
                  onClick={() => setIsUserMenuOpened(false)}
                  className="transition-colors duration-200 hover:text-white"
                  to="/fairness"
                >
                  Fairness
                </Link>
              </div>
              <div className="flex gap-3">
                <Link
                  onClick={() => setIsUserMenuOpened(false)}
                  className="transition-colors duration-200 hover:text-white"
                  to="/tos"
                >
                  TOS
                </Link>
                <Link
                  onClick={() => setIsUserMenuOpened(false)}
                  className="transition-colors duration-200 hover:text-white"
                  to="/faq"
                >
                  FAQ
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </Dropdown>
  );
};
