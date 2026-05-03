import { Link, useMatch, useParams } from '@tanstack/react-router';
import { use, useCallback, useEffect, useState } from 'react';
import aceIconGray from '../../../assets/icons/common/ace-icon-gray.svg';
import aceIcon from '../../../assets/icons/common/ace-icon.svg';
import bankIcon from '../../../assets/icons/common/bank-icon.svg';
import checkIcon from '../../../assets/icons/common/check-icon-green.svg';
import copyIcon from '../../../assets/icons/common/copy-icon.svg';
import rouletteIconGray from '../../../assets/roulette/roulette-icon-gray.svg';
import rouletteIcon from '../../../assets/roulette/roulette-icon.svg';
import { BreakpointEnum, classNames, formatBalance, useBreakpoint } from '../../../lib/utils';
import { useLobby } from '../../../providers/lobby/context';
import { ModalContext } from '../../../providers/modal/context';
import { useRoulette } from '../../../providers/roulette/context';
import { useCurrentGame, useRouletteHistory } from '../../../queries/roulette';
import { InfoTooltip } from '../../common/info-tooltip';
import { InviteToLobbyInput } from '../../common/inputs/invite-to-lobby-input';
import { WarningTooltip } from '../../common/warning-tooltip';
import { notify } from '../../toast';
import { RouletteMobileMain } from './roulette-mobile-main';
import { RouletteBoard } from './roullete-board';
import { RoulleteMainViewWrapper } from './roullete-main-view/roullete-main-view-wrapper';
import { findColorResult } from './utils';

export const RouletteWrapper = () => {
  const { lobby } = useLobby();
  const params = useParams({ strict: false });
  const isSmallerScreen = useBreakpoint(BreakpointEnum.XL);
  const isLGScreen = useBreakpoint(BreakpointEnum.LG);
  const isSmallScreen = useBreakpoint(BreakpointEnum.MD);
  const { data: rouletteHistory } = useRouletteHistory(lobby?.id);
  const blackjackMatch = useMatch({ from: '/lobby/$code/blackjack', shouldThrow: false });
  const rouletteMatch = useMatch({ from: '/lobby/$code/roulette', shouldThrow: false });
  const { currentLobbyId, isRouletteMaxWinWarning, rouletteGameStatus, handleSetGameStatus } = useRoulette();
  const { data: currentGame } = useCurrentGame(currentLobbyId);
  const { openModal } = use(ModalContext);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!lobby?.inviteLink) return;

    await navigator.clipboard
      .writeText(`${lobby?.inviteLink}/roulette`)
      .then(() => {
        notify('success', { title: 'Success', content: 'Copied to clipboard' });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }, [lobby?.inviteLink]);

  const handleOpenRouletteFairnessModal = useCallback(
    (gameId: string) => {
      if (!gameId) return;
      openModal({ key: 'roulette-fairness-modal', props: { gameId }, closable: true });
    },
    [openModal],
  );

  useEffect(() => {
    if (!currentGame || rouletteGameStatus) return;

    handleSetGameStatus(currentGame.status);
  }, [currentGame, handleSetGameStatus, rouletteGameStatus]);

  return (
    <div className="flex w-full max-w-[1200px] flex-col overflow-x-hidden">
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
        </div>
      )}

      {!isSmallerScreen && lobby && (
        <div className="flex items-center justify-between">
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-6">
              <div className="flex flex-col font-extrabold">
                <div className="text-[13px] text-[rgba(110,136,175,0.56)]">Table Host</div>
                <div className="text-base">{lobby.owner}</div>
              </div>
              <div className="flex flex-col font-extrabold">
                <div className="text-[13px] text-[#6E88AF8F]">Min-Max</div>
                <div className="text-base">
                  ${lobby.rouletteMinBet}-${lobby.rouletteMaxBet}
                </div>
              </div>
            </div>
          </div>
          <InviteToLobbyInput inviteLink={isSmallScreen ? lobby.code : lobby.inviteLink.replace(/^https?:\/\//, '')} />
        </div>
      )}
      {isSmallerScreen && lobby && (
        <div className="grid grid-cols-3">
          <div className="flex flex-col items-center justify-center">
            <div className="text-[13px] font-extrabold text-[#6E88AF8F]">Min-Max</div>
            <div className="font-extrabold text-white">
              ${lobby?.rouletteMinBet} - ${lobby?.rouletteMaxBet}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative flex w-fit flex-col items-center gap-1.5 rounded-lg bg-[#08152A] px-4 py-2 font-bold text-[#60A4FD]">
              <div className="flex items-center justify-center gap-1.5 text-[13px]">
                <img src={bankIcon} />
                Bankroll
                <InfoTooltip
                  isClickable={false}
                  isHoverable={true}
                  content="Bankroll is the available balance in this lobby. This balance can be wagered against by users who join this lobby. Balance can be added or removed from Bankroll at any time."
                  className="z-20"
                  tooltipClass="min-w-[250px] text-white font-normal"
                />
              </div>
              <div className="flex text-[16px]">${formatBalance(lobby?.rouletteBankroll)}</div>
              {isRouletteMaxWinWarning && <WarningTooltip />}
            </div>
          </div>
          <div className="relative flex w-full items-center justify-end max-md:flex">
            <input
              type="text"
              value={isLGScreen ? lobby?.code : lobby?.inviteLink.replace(/^https?:\/\//, '')}
              disabled
              className="w-full max-w-[300px] rounded-md border border-[#253C60] bg-[#08152A] py-3 pl-4 text-sm font-semibold text-white focus:outline-none max-md:max-w-[150px]"
            />
            <div className="nav-button absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-[5px]">
              <button onClick={handleCopy} className="cursor-pointer px-3 py-2" title={isCopied ? 'Copied!' : 'Copy'}>
                {isCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="relative mt-6 mb-4 flex h-full max-h-7 min-h-7 w-full gap-2 overflow-x-hidden">
        {rouletteHistory &&
          rouletteHistory.map((rouletteResult, idx) => (
            <div
              key={`roulette-history-result-${idx}`}
              onClick={() => handleOpenRouletteFairnessModal(rouletteResult.id)}
              className={classNames(
                'z-1 flex max-h-7 min-h-7 min-w-12 cursor-pointer items-center justify-center rounded-[5px] text-lg font-extrabold',
                {
                  'bg-[#328C3C]': findColorResult(rouletteResult.result.toString()) === 'green',
                  'bg-[#FF3C48]': findColorResult(rouletteResult.result.toString()) === 'red',
                  'bg-[#364E71]': findColorResult(rouletteResult.result.toString()) === 'black',
                },
              )}
            >
              {rouletteResult.result}
            </div>
          ))}
        <div
          style={{
            background: 'linear-gradient(to right, transparent -15%, rgb(16, 32, 56) 100%, rgb(16, 32, 56) 100%)',
          }}
          className="absolute top-0 left-0 h-full w-full"
        ></div>
      </div>
      {lobby && (
        <>
          {isSmallerScreen ? (
            <RouletteMobileMain />
          ) : (
            <div className="flex h-full w-full flex-col rounded-lg">
              <RoulleteMainViewWrapper bankroll={lobby.rouletteBankroll} />
              <RouletteBoard />
            </div>
          )}
        </>
      )}
    </div>
  );
};
