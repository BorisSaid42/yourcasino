import bankrollIconRed from '../../../../assets/icons/common/bank-icon-red.svg';
import bankrollIcon from '../../../../assets/icons/common/bank-icon.svg';
import { classNames, formatBalance } from '../../../../lib/utils';
import { useLobby } from '../../../../providers/lobby/context';
import { useRoulette } from '../../../../providers/roulette/context';
import { RouletteGameStatus, useCurrentGame } from '../../../../queries/roulette';
import { InfoTooltip } from '../../../common/info-tooltip';
import { WarningTooltip } from '../../../common/warning-tooltip';
import { RoulettePlaceYourBetsView } from './place-your-bets-view';
import { RoulettePlayingView } from './roulette-playing-view';

type RouletteMainWrapperType = {
  bankroll: number;
};

export const IS_BANKROLL_WARNING = true;

export const RoulleteMainViewWrapper = ({ bankroll }: RouletteMainWrapperType) => {
  const { currentLobbyId, isRouletteMaxWinWarning, rouletteGameStatus } = useRoulette();
  const { lobby } = useLobby();
  const { data: currentGame } = useCurrentGame(currentLobbyId);

  return (
    <div className="relative h-full min-h-[348px] w-full rounded-t-lg bg-[linear-gradient(180deg,_#19345E_0%,_#173053_100%)] select-none">
      <RoulettePlayingView currentGame={currentGame} />
      {(rouletteGameStatus === RouletteGameStatus.WAITING_BETS ||
        rouletteGameStatus === RouletteGameStatus.COUNTDOWN) && <RoulettePlaceYourBetsView />}
      <div
        className={classNames(
          'absolute top-3 left-3 flex flex-col items-center gap-1 rounded-lg bg-[#101E35] px-4 py-2 font-bold max-xl:hidden',
          lobby?.rouletteMinBet && lobby?.rouletteBankroll < lobby?.rouletteMinBet
            ? 'text-[#FF5656]'
            : 'text-[#60A4FD]',
        )}
      >
        <div className="flex items-center gap-1.5 text-[13px] font-extrabold">
          {lobby?.rouletteMinBet && lobby?.rouletteBankroll < lobby?.rouletteMinBet ? (
            <img src={bankrollIconRed} />
          ) : (
            <img src={bankrollIcon} />
          )}
          <div className="flex items-center gap-1.5">
            Bankroll
            <InfoTooltip
              isClickable={false}
              isHoverable={true}
              content="Bankroll is the available balance in this lobby. This balance can be wagered against by users who join this lobby. Balance can be added or removed from Bankroll at any time."
              className="z-20"
              tooltipClass="min-w-[250px] text-white font-normal"
            />
          </div>
        </div>
        <span>${formatBalance(bankroll)}</span>
        {isRouletteMaxWinWarning && <WarningTooltip />}
      </div>
    </div>
  );
};
