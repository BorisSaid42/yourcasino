import { Link, useMatch, useParams } from '@tanstack/react-router';
import aceIconGray from '../../assets/icons/common/ace-icon-gray.svg';
import aceIcon from '../../assets/icons/common/ace-icon.svg';
import bankIconRed from '../../assets/icons/common/bank-icon-red.svg';
import bankIcon from '../../assets/icons/common/bank-icon.svg';
import checkIcon from '../../assets/icons/common/check-icon-green.svg';
import copyIcon from '../../assets/icons/common/copy-icon.svg';
import rouletteIconGray from '../../assets/roulette/roulette-icon-gray.svg';
import rouletteIcon from '../../assets/roulette/roulette-icon.svg';
import { BreakpointEnum, classNames, formatBalance, useBreakpoint } from '../../lib/utils';
import { useBlackjack } from '../../providers/blackjack/context';
import { useLobby } from '../../providers/lobby/context';
import { InfoTooltip } from '../common/info-tooltip';
import { WarningTooltip } from '../common/warning-tooltip';
import { useCallback, useState } from 'react';
import { notify } from '../toast';

export const BlackJackNavMobile = () => {
  const { lobby } = useLobby();
  const { isBlackjackMaxWinWarning } = useBlackjack();
  const isSmallScreen = useBreakpoint(BreakpointEnum.MD);
  const blackjackMatch = useMatch({ from: '/lobby/$code/blackjack', shouldThrow: false });
  const rouletteMatch = useMatch({ from: '/lobby/$code/roulette', shouldThrow: false });
  const params = useParams({ strict: false });
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!lobby?.inviteLink) return;

    await navigator.clipboard
      .writeText(`${lobby?.inviteLink}/blackjack`)
      .then(() => {
        notify('success', { title: 'Success', content: 'Copied to clipboard' });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }, [lobby?.inviteLink]);

  return (
    <div className="flex flex-col gap-6 max-lg:gap-0">
      {/* NAVIGATION HERE */}
      {params?.code && (
        <div className="mb-4 hidden gap-7 border-b-[2px] border-[#253C60] pb-[16px] max-xl:flex">
          {lobby && lobby.isBlackjackEnabled && (
            <Link
              activeOptions={{ exact: true }}
              params={{ code: params.code }}
              className={classNames('relative h-7 cursor-pointer', !blackjackMatch ? 'opacity-50 select-none' : '')}
              activeProps={{
                className: 'pointer-events-none',
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
                {blackjackMatch && <div className="absolute -bottom-[18px] h-[2px] w-full bg-[#60A4FD]"></div>}
              </div>
            </Link>
          )}
          {lobby && lobby.isRouletteEnabled && (
            <Link
              activeOptions={{ exact: true }}
              params={{ code: params.code }}
              className={classNames('relative h-7 cursor-pointer', !rouletteMatch ? 'opacity-50 select-none' : '')}
              activeProps={{
                className: 'pointer-events-none',
              }}
              to="/lobby/$code/roulette"
            >
              <div className="relative flex h-full gap-3 select-none">
                <div className="flex flex-col gap-0.5">
                  <div className="flex gap-2">
                    {rouletteMatch ? <img src={rouletteIcon} width={18} /> : <img src={rouletteIconGray} width={18} />}
                    <span className="text-base font-bold">Roulette</span>
                  </div>
                  {rouletteMatch && <span className="pl-7 text-xs font-bold text-[#60A4FD]">In-Game</span>}
                </div>
                {rouletteMatch && <div className="absolute -bottom-[18px] h-[2px] w-full bg-[#60A4FD]"></div>}
              </div>
            </Link>
          )}
        </div>
      )}
      <div className="grid grid-cols-3">
        <div className="flex flex-col items-center justify-center">
          <div className="text-[13px] font-extrabold text-[#6E88AF8F]">Min-Max</div>
          <div className="font-extrabold text-white">
            ${lobby?.minBet} - ${lobby?.maxBet}
          </div>
        </div>
        <div className="flex justify-center">
          <div
            className={classNames(
              'relative flex w-fit flex-col items-center gap-1.5 rounded-t-lg bg-[#08152A] px-4 py-2 font-bold',
              lobby?.minBet && lobby?.bankroll < lobby?.minBet ? 'text-[#FF5656]' : 'text-[#60A4FD]',
            )}
          >
            <div className="flex items-center gap-1.5 text-[13px]">
              {lobby?.minBet && lobby?.bankroll < lobby?.minBet ? <img src={bankIconRed} /> : <img src={bankIcon} />}
              Bankroll{' '}
              <InfoTooltip
                isClickable={false}
                isHoverable={true}
                content="Bankroll is the available balance in this lobby. This balance can be wagered against by users who join this lobby. Balance can be added or removed from Bankroll at any time."
                className="z-20"
                tooltipClass="min-w-[250px] text-white font-normal"
              />
            </div>
            <div className="flex text-[16px]">${formatBalance(lobby?.bankroll)}</div>
            {isBlackjackMaxWinWarning && <WarningTooltip />}
          </div>
        </div>
        {/* <div className="flex flex-col items-end justify-center max-md:hidden">
          <div className="text-[13px] font-extrabold text-[#6E88AF8F]">Table Host</div>
          <div className="font-extrabold text-white">{lobby.owner}</div>
        </div> */}
        <div className="relative flex w-full items-center justify-end max-md:flex">
          <input
            type="text"
            value={isSmallScreen ? lobby?.code : lobby?.inviteLink.replace(/^https?:\/\//, '')}
            disabled
            className="w-full max-w-[300px] rounded-md border border-[#253C60] bg-[#08152A] py-3 pl-4 text-sm font-semibold text-white focus:outline-none max-md:max-w-[150px]"
          />
          <div className="absolute top-1/2 right-[1px] z-10 -translate-y-1/2 border-r-8 border-l-2 border-[#08152A] bg-[#08152A]">
            <div className="nav-button rounded-[5px]">
              <button onClick={handleCopy} className="cursor-pointer px-3 py-2" title="Copy">
                {isCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
