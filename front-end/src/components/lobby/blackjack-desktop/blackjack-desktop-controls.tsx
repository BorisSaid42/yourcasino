import { useCallback, useEffect, useMemo } from 'react';
import clearIcon from '../../../assets/icons/common/clear-icon.svg';
import rebetIcon from '../../../assets/icons/common/loop-icon.svg';
import undoIcon from '../../../assets/icons/common/undo-icon.svg';
import { sockets } from '../../../lib/interaction/sockets';
import { classNames } from '../../../lib/utils';
import { useBlackjack } from '../../../providers/blackjack/context';
import { useLobby } from '../../../providers/lobby/context';
import { useMedia } from '../../../providers/media/context';
import { resourceManager } from '../../../providers/resource-manager';
import { useCredentials } from '../../../queries/auth';
import { BlackjackGameStatus, useCurrentGame } from '../../../queries/blackjack';
import { GenericButton } from '../../common/buttons';
import { notify } from '../../toast';
import { chipMap } from '../lobby-table-seats';
import { useUser } from '../../../queries/user';

export const BlackjackDesktopControls = ({ timeLeft }: { timeLeft: number }) => {
  const { lobby: currentLobby } = useLobby();
  const { data: currentGame } = useCurrentGame(currentLobby?.id);
  const { isMuted } = useMedia();
  const { data: credentials } = useCredentials();
  const { handleChangeBetAmount, selectedBetAmount } = useBlackjack();
  const { data: user } = useUser();

  const showBetSection = useMemo(() => {
    return (
      currentGame?.status === BlackjackGameStatus.WAITING_BETS || currentGame?.status === BlackjackGameStatus.COUNTDOWN
    );
  }, [currentGame?.status]);

  useEffect(() => {
    if (selectedBetAmount && selectedBetAmount > 0) return;
    if (!currentLobby || !credentials.user || !user || !currentGame) return;

    const availableChips = [0.5, 1, 5, 10, 25, 50, 100];
    const userBalance = user.balance;
    const minBet = currentLobby.minBet;
    const maxBet = currentLobby.maxBet;

    const optimalChip = availableChips
      .filter((chip) => chip >= minBet && chip <= maxBet && chip <= userBalance)
      .sort((a, b) => b - a)[0];

    if (optimalChip) {
      handleChangeBetAmount(optimalChip);
    } else {
      handleChangeBetAmount(availableChips[0]);
    }
  }, [credentials.user, currentGame, currentLobby, handleChangeBetAmount, selectedBetAmount, user]);

  const handleControlsBet = useCallback(
    (controlType: string) => {
      if (!currentLobby) {
        notify('error', { content: 'Lobby is not loaded.', title: 'Error' });
        return;
      }

      if (controlType === 'dealnow') {
        resourceManager.playAudio('deal-now', { volume: isMuted ? 0 : 100, clone: true });
        const player = currentGame?.players?.find((player) => player.userId === credentials?.user);

        const totalBetAmount = player?.bets.reduce((sum, bet) => sum + bet.amount, 0) ?? 0;
        if (totalBetAmount < currentLobby.minBet) {
          notify('error', { content: `You need to bet at least $${currentLobby.minBet.toFixed(2)}`, title: 'Error' });
          return;
        }
      }

      sockets.emit(`blackjack:bet:${controlType}`, {
        lobbyId: currentLobby.id,
        controlType,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sockets.once('blackjack:bet:error', (err: any) => {
        notify('error', { content: err.message || 'Bet failed', title: 'Error' });
      });
    },
    [credentials?.user, currentGame?.players, isMuted, currentLobby],
  );

  return (
    <div
      className={classNames(
        'absolute left-1/2 flex -translate-x-1/2 flex-col items-center py-4 transition-all duration-500 ease-in-out',
        showBetSection
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-8 opacity-0',
      )}
    >
      {currentGame?.status === BlackjackGameStatus.COUNTDOWN && timeLeft > 0 && (
        <div className="fixed top-0 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 pb-[17px]">
          <div className="h-1 w-[300px] overflow-hidden rounded bg-[#08152A]">
            <div
              className="h-full rounded bg-[#4EC87D] transition-all duration-[100ms] ease-linear"
              style={{
                width: `${(timeLeft / 10) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="pb-9 text-2xl font-bold text-white select-none">PLACE YOUR BETS</div>

      <div className="flex gap-5 pb-12 select-none">
        {[0.5, 1, 5, 10, 25, 50, 100].map((amount) => (
          <button
            key={`blackjack-bet-${amount}`}
            onClick={() => {
              handleChangeBetAmount(amount);
            }}
            className={classNames(
              'cursor-pointer pt-0.5 transition-all duration-100',
              'roulette-chip',
              selectedBetAmount === amount ? 'shadow-[0_0_10px_1.25px_#4EC87D] ring-1 ring-[#4EC87D]' : '',
            )}
          >
            <div className="relative flex h-20 w-20 items-center justify-center">
              <img
                src={chipMap[amount]}
                alt={`Chip ${amount}`}
                className={classNames(
                  'aspect-square transition-transform duration-100',
                  selectedBetAmount === amount ? 'scale-90' : 'scale-100',
                )}
              />
              <span
                className={classNames(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20px] font-extrabold drop-shadow-sm',
                  amount === 0.5 ? 'text-[#2B272A]' : 'text-white',
                  amount === 0.5 || amount === 100 ? 'text-[18px]' : '',
                )}
              >
                ${amount}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 pr-4 select-none">
        <GenericButton
          isFullWidth
          leftIcon={<img src={rebetIcon} />}
          onClick={() => handleControlsBet('rebet')}
          skin="betControl"
          className="bet-control-button"
          text="REBET"
        />
        <GenericButton
          isFullWidth
          leftIcon={<img src={undoIcon} />}
          onClick={() => handleControlsBet('undo')}
          skin="betControl"
          className="bet-control-button"
          text="UNDO"
        />
        <GenericButton
          isFullWidth
          onClick={() => handleControlsBet('x2')}
          skin="betControl"
          className="bet-control-button"
          text="X2 BET"
        />
        <GenericButton
          isFullWidth
          leftIcon={<img src={clearIcon} />}
          onClick={() => handleControlsBet('clear')}
          skin="betControl"
          className="bet-control-button"
          text="CLEAR"
        />
      </div>
    </div>
  );
};
