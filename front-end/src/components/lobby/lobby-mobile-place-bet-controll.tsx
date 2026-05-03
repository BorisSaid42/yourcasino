import { use, useCallback, useEffect } from 'react';
import { sockets } from '../../lib/interaction/sockets';
import { classNames, getBaseChip } from '../../lib/utils';
import { useLobby } from '../../providers/lobby/context';
import { ModalContext } from '../../providers/modal/context';
import { useCredentials } from '../../queries/auth';
import { BlackjackGame, BlackjackGameStatus, Player, useCurrentGame } from '../../queries/blackjack';
import { LobbyType } from '../../queries/lobby';
import { chipMap } from './lobby-table-seats';

export const LobbyMobilePlaceBetControll = ({
  seat,
  handlePlaceBet,
  styles,
}: {
  seat: Player | undefined;
  handlePlaceBet?: (betAmount: string, lobby: LobbyType, currentGame: BlackjackGame) => void;
  styles?: React.CSSProperties;
}) => {
  const { lobby } = useLobby();
  const { openModal } = use(ModalContext);
  const { data: credentials } = useCredentials();
  const { data: currentGame } = useCurrentGame(lobby?.id);

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

    sockets.on('blackjack:max-win-notice', handleOpenMaxWinNoticeModal);
    return () => {
      sockets.off('blackjack:max-win-notice', handleOpenMaxWinNoticeModal);
    };
  }, [credentials?.user, openModal]);

  const isPlayerBlackjack = useCallback(
    (player: Player): boolean => {
      if (player.hands.length > 1) return false;

      const hasBlackjack = player.hands[0]?.handTotal === 21 && player.hands[0]?.hand?.length === 2;

      const potentialDealerBlackjack =
        (currentGame?.dealerHandTotal === 10 || currentGame?.dealerHandTotal === 11) &&
        currentGame?.dealerHand?.length === 1;

      if (hasBlackjack && !potentialDealerBlackjack) return true;

      return false;
    },
    [currentGame?.dealerHand?.length, currentGame?.dealerHandTotal],
  );

  if (!currentGame) return null;

  return (
    // MAIN
    <div
      className={classNames(
        'flex min-w-[50px] rounded-[451px] bg-[linear-gradient(90deg,_#0E2547_0%,_#112B55_100%)] font-bold text-[#6E88AF]',
        lobby?.sideBets && 'min-w-[200px] max-sm:min-w-[175px]',
        seat?.userId === credentials?.user && 'shadow-[0_0_21.65px_0.9px_#4EC87DB8]',
      )}
      style={{ marginBottom: '0px', ...styles }}
    >
      {/* 1px ORANGE BORDER OUTER */}
      <div className={classNames('w-full rounded-[451px] p-[1px]')}>
        {/* ORANGE BORDER GRADIENT */}
        <div className="flex w-full rounded-[451px] px-1 py-0.5">
          {/* INNER CONTAINER */}
          <div className="relative flex min-h-8 w-full items-center justify-between rounded-[451px] bg-[linear-gradient(0deg,_#112B55_0%,_#0E2547_100%)]">
            {/* PERFECT PAIR BUTTON WRAPPER */}
            {lobby?.sideBets && (
              <div
                onClick={() => handlePlaceBet?.('perfect_pair', lobby, currentGame)}
                className="items relative flex flex-col items-center pl-2 text-[9px] select-none"
              >
                PERFECT <span className="text-sm">PAIR</span>
                {seat?.bets?.some((bet) => bet.betPlace === 'perfect_pair') &&
                  (() => {
                    const totalAmount = seat.bets
                      .filter((bet) => bet.betPlace === 'perfect_pair')
                      .reduce(
                        (sum, bet) =>
                          sum +
                          (currentGame?.status !== BlackjackGameStatus.WAITING_BETS &&
                          currentGame?.status !== BlackjackGameStatus.COUNTDOWN &&
                          ((seat.hands.length >= 1 && seat.hands[0].hand.length >= 2) ||
                            (seat.hands.length > 1 && seat.hands[0].hasSplitted))
                            ? bet.wonAmount
                            : bet.amount),
                        0,
                      );

                    if (!totalAmount) return;

                    const baseChip = getBaseChip(totalAmount);
                    const chipSrc = chipMap[baseChip];

                    return (
                      <div className="absolute top-[-1px] h-[34px]">
                        <img className="h-full w-full" src={chipSrc} alt={`Bet ${totalAmount}`} />
                        <span
                          className={classNames(
                            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold whitespace-nowrap drop-shadow-sm select-none',
                            baseChip === 0.5 ? 'text-black' : 'text-white',
                            String(totalAmount).length >= 4 ? 'text-[8px]' : 'text-[10px]',
                          )}
                        >
                          ${totalAmount}
                        </span>
                      </div>
                    );
                  })()}
              </div>
            )}
            {/* MAIN BUTTON WRAPPER && MAIN BORDER*/}
            {!!lobby && (
              <div
                onClick={() => handlePlaceBet?.('main', lobby, currentGame)}
                className="absolute left-[50%] flex min-h-[62px] min-w-[62px] -translate-x-1/2 rounded-[50%] bg-[linear-gradient(0deg,_#0E2547_0%,_#112B55_100%)] select-none"
              >
                {/* 1px ORANGE BORDER */}
                <div className={classNames('w-full rounded-[451px] bg-transparent p-[1px]')}>
                  {/* ORANGE GRADIENT */}
                  <div className={classNames('flex h-full w-full items-center justify-center rounded-[451px] p-[3px]')}>
                    <div className="flex h-full w-full items-center justify-center rounded-[451px] bg-[linear-gradient(0deg,_#112B55_0%,_#0E2547_100%)]">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-sm:text-xs">
                        MAIN
                      </span>
                      {seat?.bets?.some((bet) => bet.betPlace === 'main') &&
                        (() => {
                          const totalAmount = seat.bets
                            .filter((bet) => bet.betPlace === 'main')
                            .reduce(
                              (sum, bet) =>
                                sum +
                                ([
                                  BlackjackGameStatus.RESOLVING_USER_PAYOUTS,
                                  BlackjackGameStatus.RESOLVING_BETS,
                                  BlackjackGameStatus.FINISHED,
                                ].includes(currentGame?.status) || isPlayerBlackjack(seat)
                                  ? bet.wonAmount
                                  : bet.amount),
                              0,
                            );

                          if (!totalAmount) return;

                          const baseChip = getBaseChip(totalAmount);
                          const chipSrc = chipMap[baseChip];

                          return (
                            <div className="absolute h-[70%] w-[70%]">
                              <img className="h-full w-full" src={chipSrc} alt={`Bet ${totalAmount}`} />
                              <span
                                className={classNames(
                                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold whitespace-nowrap drop-shadow-sm select-none',
                                  baseChip === 0.5 ? 'text-black' : 'text-white',
                                  String(totalAmount).length >= 4 ? 'text-[8px]' : 'text-sm',
                                )}
                              >
                                ${totalAmount}
                              </span>
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* 21 + 3 BUTTON WRAPPER */}
            {lobby?.sideBets && (
              <div
                onClick={() => handlePlaceBet?.('side_21_3', lobby, currentGame)}
                className="relative flex h-full flex-col justify-center pr-2 select-none"
              >
                <div className="relative flex items-center justify-center">21+3</div>
                {seat?.bets?.some((bet) => bet.betPlace === 'side_21_3') &&
                  (() => {
                    const totalAmount = seat.bets
                      .filter((bet) => bet.betPlace === 'side_21_3')
                      .reduce(
                        (sum, bet) =>
                          sum +
                          (currentGame?.status !== BlackjackGameStatus.WAITING_BETS &&
                          currentGame?.status !== BlackjackGameStatus.COUNTDOWN &&
                          ((seat.hands.length >= 1 && seat.hands[0].hand.length >= 2) ||
                            (seat.hands.length > 1 && seat.hands[0].hasSplitted))
                            ? bet.wonAmount
                            : bet.amount),
                        0,
                      );
                    if (!totalAmount) return;

                    const baseChip = getBaseChip(totalAmount);
                    const chipSrc = chipMap[baseChip];

                    return (
                      <div className="absolute top-[-1px] left-[-10px] h-[34px]">
                        <img className="h-full w-full" src={chipSrc} alt={`Bet ${totalAmount}`} />
                        <span
                          className={classNames(
                            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold whitespace-nowrap drop-shadow-sm select-none',
                            baseChip === 0.5 ? 'text-black' : 'text-white',
                            String(totalAmount).length >= 4 ? 'text-[8px]' : 'text-[10px]',
                          )}
                        >
                          ${totalAmount}
                        </span>
                      </div>
                    );
                  })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
