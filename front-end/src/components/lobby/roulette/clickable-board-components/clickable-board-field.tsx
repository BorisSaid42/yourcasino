import { memo, use, useCallback, useEffect, useMemo, useState } from 'react';
import { BreakpointEnum, classNames, getBaseChip, useBreakpoint } from '../../../../lib/utils';
import { chipMap } from '../../lobby-table-seats';
import { notify } from '../../../toast';
import { useRoulette } from '../../../../providers/roulette/context';
import { sockets } from '../../../../lib/interaction/sockets';
import { RouletteGameStatus, RouletteUserBet, useCurrentGame } from '../../../../queries/roulette';
import { useCredentials } from '../../../../queries/auth';
import { ModalContext } from '../../../../providers/modal/context';

export const ClickableBoardField = memo(
  ({
    values,
    onMouseEnter,
    onMouseLeave,
    selectedChipAmount,
    className,
    style,
    userBets,
  }: {
    values: string;
    onMouseEnter?: (field: string) => void;
    onMouseLeave?: () => void;
    selectedChipAmount: number;
    className: string;
    style?: React.CSSProperties;
    userBets?: RouletteUserBet[];
  }) => {
    const [betAmount, setBetAmount] = useState(0);
    const { rouletteGameStatus, currentLobbyId } = useRoulette();
    const isLaptopOrSmaller = useBreakpoint(BreakpointEnum.XL);
    const { data: currentGame } = useCurrentGame(currentLobbyId);
    const { data: credentials } = useCredentials();
    const { openModal } = use(ModalContext);

    useEffect(() => {
      const handleOpenMaxWinNoticeModal = (data: { lobbyId: string; userId: string; gameId: string }) => {
        const alreadySet = localStorage.getItem(`dont-show-notice-${data.lobbyId}-${data.userId}`);
        const confirmed = localStorage.getItem(`dont-show-notice-${data.gameId}-${data.userId}`);
        if (alreadySet === 'true' || confirmed === 'true' || credentials?.user !== data.userId) {
          return;
        }
        openModal({
          key: 'max-win-notice',
          props: { lobbyId: data.lobbyId, userId: data.userId, gameId: data.gameId },
          closable: false,
        });
      };

      sockets.on('roulette:max-win-notice', handleOpenMaxWinNoticeModal);
      return () => {
        sockets.off('roulette:max-win-notice', handleOpenMaxWinNoticeModal);
      };
    }, [credentials?.user, openModal]);

    const fieldValuesToKey = useCallback(() => {
      // if normal number field or split return full values, for special sidebets returns just sidebet key
      if (
        values.includes('_') ||
        values.includes('/') ||
        values.includes('Black') ||
        values.includes('Red') ||
        values.includes('Even') ||
        values.includes('Odd')
      ) {
        return values.split('-')[0].trim();
      }

      return values;
    }, [values]);

    const fieldKey = useMemo(() => fieldValuesToKey(), [fieldValuesToKey]);

    useEffect(() => {
      if (userBets && userBets.length > 0) {
        const totalAmount = userBets
          .filter((bet) => bet.betPlace === fieldKey)
          .reduce(
            (prev, cur) => (prev += rouletteGameStatus === RouletteGameStatus.FINISHED ? cur.wonAmount : cur.amount),
            0,
          );
        setBetAmount(totalAmount);
        return;
      }

      setBetAmount(0);
    }, [rouletteGameStatus, fieldKey, userBets]);

    const handlePlaceBet = useCallback(() => {
      if (currentGame?.lobby?.ownerId === credentials?.user) {
        return;
      }

      if (rouletteGameStatus === RouletteGameStatus.PLAYING || rouletteGameStatus === RouletteGameStatus.FINISHED) {
        return;
      }

      if (selectedChipAmount === 0) {
        notify('error', { title: 'Error', content: 'Please select chip amount first' });
        return;
      }

      // Maps special keys like 1 to 12, odd, red, 1:2 etc
      const fieldMark = fieldValuesToKey();

      sockets.emit(`roulette:bet`, {
        lobbyId: currentLobbyId,
        amount: selectedChipAmount,
        betPlace: fieldMark,
      });

      sockets.once('roulette:bet:error', (err: Error) => {
        notify('error', { title: 'Error', content: err.message || 'Bet failed' });
      });
    }, [
      credentials?.user,
      currentGame?.lobby?.ownerId,
      currentLobbyId,
      fieldValuesToKey,
      rouletteGameStatus,
      selectedChipAmount,
    ]);

    const handleRemoveBet = useCallback(() => {
      if (
        rouletteGameStatus !== RouletteGameStatus.COUNTDOWN &&
        rouletteGameStatus !== RouletteGameStatus.WAITING_BETS
      ) {
        return;
      }

      const fieldMark = fieldValuesToKey();

      sockets.emit(`roulette:remove:bet`, {
        lobbyId: currentLobbyId,
        betPlace: fieldMark,
      });

      sockets.once('roulette:bet:error', (err: Error) => {
        notify('error', { title: 'Error', content: err.message || 'Bet failed' });
      });
    }, [currentLobbyId, fieldValuesToKey, rouletteGameStatus]);

    const baseChip = getBaseChip(betAmount);

    const handleFiledHover = useCallback(() => {
      // Highlight fields only if game is in betting status
      if (
        (rouletteGameStatus === RouletteGameStatus.WAITING_BETS ||
          rouletteGameStatus === RouletteGameStatus.COUNTDOWN) &&
        onMouseEnter
      ) {
        onMouseEnter(values);
      }
    }, [onMouseEnter, rouletteGameStatus, values]);

    const handleHoverLeave = useCallback(() => {
      // Clear highlighted fields only if game is in betting status
      if (
        (rouletteGameStatus === RouletteGameStatus.WAITING_BETS ||
          rouletteGameStatus === RouletteGameStatus.COUNTDOWN) &&
        onMouseLeave
      ) {
        onMouseLeave();
      }
    }, [onMouseLeave, rouletteGameStatus]);

    return (
      <div
        className={classNames('overflow-visible select-none', className)}
        style={{
          cursor:
            rouletteGameStatus === RouletteGameStatus.PLAYING || rouletteGameStatus === RouletteGameStatus.FINISHED
              ? 'default'
              : 'pointer',
          // border: '1px solid',
          ...style,
        }}
        onClick={handlePlaceBet}
        onMouseEnter={handleFiledHover}
        onMouseLeave={handleHoverLeave}
        onContextMenu={(e) => {
          e.preventDefault();
          handleRemoveBet();
        }}
      >
        {betAmount > 0 && (
          <div className="absolute top-1/2 left-1/2 w-[30px] -translate-x-[50%] -translate-y-[50%] max-xl:w-[20px]">
            <img className="w-[30px] max-lg:w-[20px]" src={chipMap[baseChip]} alt={`Bet ${betAmount}`} />
            <span
              className={classNames(
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold whitespace-nowrap drop-shadow-sm select-none',
                baseChip === 0.5 ? 'text-black' : 'text-white',
                String(betAmount).length >= 4 ? 'text-[8px]' : 'text-[10px]',
              )}
            >
              {isLaptopOrSmaller ? null : '$'}
              {betAmount}
            </span>
          </div>
        )}
      </div>
    );
  },
);
