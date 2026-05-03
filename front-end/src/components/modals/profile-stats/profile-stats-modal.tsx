import { format } from 'date-fns';
import { use, useCallback } from 'react';
import aceIcon from '../../../assets/icons/common/ace-icon.svg';
import createIconBlue from '../../../assets/icons/common/create-icon-blue.svg';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import pencilIcon from '../../../assets/icons/common/pencil-icon.svg';
import dollarIcon from '../../../assets/icons/common/dollar-icon.svg';
import profileIcon from '../../../assets/icons/profile-icon.svg';
import greenDollarIcon from '../../../assets/icons/statistics/green-dollar-icon.svg';
import redDollarIcon from '../../../assets/icons/statistics/red-dollar-icon.svg';
import { classNames } from '../../../lib/utils';
import { ModalContext } from '../../../providers/modal/context';
import { useProfileStats, useResetProfileStats } from '../../../queries/profile';
import { useCredentials } from '../../../queries/auth';
import { notify } from '../../toast';
import { SocketLockContext } from '../../../providers/socket-locks/context';

export const ProfileStatsModal = () => {
  const { closeModal, replaceModal } = use(ModalContext);
  const { data: credentials } = useCredentials();
  const { data: profileStats } = useProfileStats(credentials?.user);
  const resetProfileStats = useResetProfileStats(credentials?.user);
  const { isLocked, setLock } = use(SocketLockContext);

  const handleResetProfileStats = async () => {
    if (
      profileStats &&
      profileStats.netProfit === 0 &&
      profileStats.totalBets === 0 &&
      profileStats.wagered === 0 &&
      profileStats.totalLobbies === 0
    )
      return;

    setLock('reset-profile-stats', true);
    await resetProfileStats.mutateAsync(undefined, {
      onSuccess: () => {
        setLock('reset-profile-stats', false);
        notify('success', {
          title: 'Reset Profile Stats',
          content: 'Your profile stats have been successfully reset.',
        });
      },
      onError: (err) => {
        setLock('reset-profile-stats', false);
        notify('error', { title: 'Reset Profile Stats', content: `Something went wrong. ${err.message}` });
      },
    });
  };

  const handleOpenChangeUsernameModal = useCallback(() => {
    replaceModal((prevOptions) => ({
      key: 'change-username-modal',
      props: prevOptions.props,
      closable: true,
    }));
  }, [replaceModal]);

  const netProfit = profileStats?.netProfit ?? 0;

  const isPositive = netProfit > 0;
  const isNegative = netProfit < 0;
  const sign = isPositive ? '+' : isNegative ? '-' : '';

  const icon = isPositive ? greenDollarIcon : isNegative ? redDollarIcon : dollarIcon;

  const headerColor = isPositive ? 'text-[#4EC87D]' : isNegative ? 'text-[#FF5656]' : 'text-[#6D8AB7]';
  const textColor = isPositive ? 'text-[#4EC87D]' : isNegative ? 'text-[#FF5656]' : 'text-white';
  const bgColor = isPositive ? 'bg-[#1E4250]' : isNegative ? 'bg-[#5f404875]' : 'bg-[#253C60]';

  return (
    <div className="flex min-h-[300px] min-w-[500px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      {profileStats && (
        <>
          <div className="relative flex w-full items-center justify-between border-b border-[#12223B] px-9 py-5 max-md:px-3.5 max-md:py-4">
            <div className="flex gap-3">
              <img width={32} src={profileIcon} />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-[#6E88AF]">{profileStats?.username}</span>{' '}
                  <div
                    onClick={handleOpenChangeUsernameModal}
                    className="cursor-pointer rounded-[5px] bg-[#3B557D55] p-1.5 hover:bg-[#3B557D]"
                  >
                    <img className="w-[15px]" src={pencilIcon} />
                  </div>
                </div>

                {profileStats?.createdAt && (
                  <span className="flex min-h-[18px] items-center rounded-[5px] border border-[#253C60] bg-[#3B557D] px-[5px] text-xs font-extrabold">
                    Joined {format(profileStats.createdAt, 'MMMM do, yyyy')}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
              <img src={crossIcon} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 px-9 py-6 max-md:px-3.5">
            <div className="f-full flex w-full gap-5 rounded-[5px] bg-[#253C60] px-5 py-2">
              <img width={16} src={dollarIcon} />
              <div className="flex flex-col justify-center">
                <span className="text-xs font-extrabold text-[#6D8AB7]">Wagered</span>
                <span className="text-base font-bold">
                  $
                  {profileStats?.wagered.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <div className={classNames('flex gap-5 rounded-[5px] px-5 py-2', bgColor)}>
              <img width={14} src={icon} alt="gross profit icon" />
              <div className="flex flex-col justify-center">
                <span className={classNames('text-xs font-extrabold', headerColor)}>Gross Profit</span>
                <span className={classNames('text-base font-bold', textColor)}>
                  {sign}$
                  {Math.abs(netProfit).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <div className="f-full flex w-full gap-5 rounded-[5px] bg-[#253C60] px-5 py-2">
              <img width={22} src={aceIcon} />
              <div className="flex flex-col justify-center">
                <span className="text-xs font-extrabold text-[#6D8AB7]">Total Bets</span>
                <span className="text-base font-bold">{profileStats?.totalBets}</span>
              </div>
            </div>
            <div className="f-full flex w-full gap-5 rounded-[5px] bg-[#253C60] px-5 py-2">
              <img width={24} src={createIconBlue} />
              <div className="flex flex-col justify-center">
                <span className="text-xs font-extrabold text-[#6D8AB7]">Tables Created</span>
                <span className="text-base font-bold">{profileStats?.totalLobbies}</span>
              </div>
            </div>
          </div>
          <div className="w-full px-9 max-md:px-3.5">
            <button
              disabled={isLocked('reset-profile-stats')}
              onClick={handleResetProfileStats}
              className={classNames(
                'w-full cursor-pointer rounded-[5px] bg-[#1D3353CC] py-4 text-center font-bold text-[#6E88AFCC]',
                isLocked('reset-profile-stats')
                  ? 'cursor-default opacity-[0.5] select-none'
                  : 'hover:bg-[#1D3353] hover:text-[#6E88AF]',
              )}
            >
              Reset Stats
            </button>
          </div>
        </>
      )}
    </div>
  );
};
