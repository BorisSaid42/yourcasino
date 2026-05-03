import { useState } from 'react';
import bankIconRed from '../../../assets/icons/common/bank-icon-red.svg';
import bankIcon from '../../../assets/icons/common/bank-icon.svg';
import copyIcon from '../../../assets/icons/common/copy-icon.svg';
import checkIcon from '../../../assets/icons/common/check-icon-green.svg';
import { classNames, formatBalance } from '../../../lib/utils';
import { useBlackjack } from '../../../providers/blackjack/context';
import { useLobby } from '../../../providers/lobby/context';
import { InfoTooltip } from '../../common/info-tooltip';
import { WarningTooltip } from '../../common/warning-tooltip';
import { notify } from '../../toast';

export const BlackjackDesktopNav = () => {
  const { lobby: currentLobby } = useLobby();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!currentLobby?.inviteLink) return;

    await navigator.clipboard
      .writeText(`${currentLobby?.inviteLink}/blackjack`)
      .then(() => {
        notify('success', { title: 'Success', content: 'Copied to clipboard' });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  const { isBlackjackMaxWinWarning } = useBlackjack();

  return (
    <div className="relative z-10 flex w-full max-w-[1200px] items-center justify-between px-3">
      <div className="flex w-full max-w-[40%] justify-center gap-6">
        <div className="flex flex-col items-center justify-between">
          <div className="text-[13px] font-extrabold text-[#6E88AF8F]">Table Host</div>
          <div className="font-extrabold text-white">{currentLobby?.owner}</div>
        </div>
        <div className="flex flex-col items-center justify-between">
          <div className="text-[13px] font-extrabold text-[#6E88AF8F]">Min-Max</div>
          <div className="font-extrabold text-white">
            ${currentLobby?.minBet} - ${currentLobby?.maxBet}
          </div>
        </div>
      </div>
      <div>
        <div className="relative min-w-[320px]">
          <input
            type="text"
            value={currentLobby?.inviteLink.replace(/^https?:\/\//, '')}
            disabled
            className="w-full rounded-md border border-[#253C60] bg-[#08152A] py-3 pl-4 text-sm font-semibold text-white focus:outline-none"
          />
          <div className="absolute top-1/2 right-[1px] z-10 -translate-y-1/2 border-r-8 border-l-4 border-[#08152A] bg-[#08152A]">
            <div className="nav-button rounded-[5px]">
              <button onClick={handleCopy} className="cursor-pointer px-5 py-2" title={isCopied ? 'Copied!' : 'Copy'}>
                {isCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 select-none">
        <div
          className={classNames(
            'relative flex flex-col items-center gap-1.5 rounded-t-lg bg-[#08152A] px-4 py-2 font-bold',
            currentLobby?.minBet && currentLobby?.bankroll < currentLobby?.minBet ? 'text-[#FF5656]' : 'text-[#60A4FD]',
          )}
        >
          <div className="flex items-center gap-1.5 text-[13px]">
            {currentLobby?.minBet && currentLobby?.bankroll < currentLobby?.minBet ? (
              <img src={bankIconRed} />
            ) : (
              <img src={bankIcon} />
            )}
            Bankroll{' '}
            <InfoTooltip
              isClickable={false}
              isHoverable={true}
              content="Bankroll is the available balance in this lobby. This balance can be wagered against by users who join this lobby. Balance can be added or removed from Bankroll at any time."
              className="z-20"
              tooltipClass="min-w-[250px] text-white font-normal"
            />
          </div>
          <div className="flex text-[16px]">${formatBalance(currentLobby?.bankroll)}</div>
          {isBlackjackMaxWinWarning && <WarningTooltip />}
        </div>
      </div>
    </div>
  );
};
