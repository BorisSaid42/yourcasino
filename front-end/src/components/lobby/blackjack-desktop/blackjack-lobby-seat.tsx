import { use, useCallback } from 'react';
import profileIcon from '../../../assets/icons/common/profile-icon.svg';
import joinTableIcon from '../../../assets/icons/lobby/join-table-icon.svg';
import betsGlowCurrentBetting from '../../../assets/table/bet-spot-betting.svg';
import betsMainGlowCurrentBetting from '../../../assets/table/bet-spot-main-betting.svg';
import betsMainGlowCurrentPlaying from '../../../assets/table/bet-spot-main-current.svg';
import betsSpotRegular from '../../../assets/table/bet-spot.svg';
import mainBetSvg from '../../../assets/table/main-bet.svg';
import sideBet21_3Svg from '../../../assets/table/side-bet-21_3.svg';
import sideBetPerfectPairSvg from '../../../assets/table/side-bet-perfect-pair.svg';
import yourTurnArrowIcon from '../../../assets/table/your-turn-arrow.svg';
import { sockets } from '../../../lib/interaction/sockets';
import { classNames } from '../../../lib/utils';
import { useBlackjack } from '../../../providers/blackjack/context';
import { useLobby } from '../../../providers/lobby/context';
import { ModalContext } from '../../../providers/modal/context';
import { useCredentials } from '../../../queries/auth';
import { BlackjackGameStatus, useCurrentGame } from '../../../queries/blackjack';
import { AuthModalOpened } from '../../modals/auth/auth-modal.enum';
import { notify } from '../../toast';
import { Card } from '../card';
import { HandTotal } from '../hand-total';
import { BlackjackTwentyOneThreeAmount } from './blackjack-21-3-amount';
import { BlackjackMainBetAmount } from './blackjack-main-bet-place-amount';
import { BlackjackPerfectPairBetAmount } from './blackjack-perfect-pair-amount';

export const BlackjackLobbySeat = ({ t, i }: { t: number; i: number }) => {
  const { lobby: currentLobby } = useLobby();
  const { data: currentGame } = useCurrentGame(currentLobby?.id);
  const { data: credentials } = useCredentials();
  const { openModal } = use(ModalContext);
  const radiusX = 660;
  const radiusY = 520;
  const { onPlaceBet } = useBlackjack();

  const angleDeg = t * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const rotationFactor = 0.9;
  const towardCenterDeg = (angleDeg - 90) * rotationFactor;

  const x = radiusX * Math.cos(angleRad);
  const y = radiusY * Math.sin(angleRad);

  const seat = currentGame?.players?.find((s) => s.seatIndex === i) ?? null;

  const handleJoinSeat = useCallback(
    (seatIndex: number) => {
      if (!currentLobby?.id) return;

      if (
        currentGame?.players?.some((player) => player.userId === credentials?.user) ||
        currentLobby?.ownerId === credentials?.user
      )
        return;

      if (!credentials?.user) {
        openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
        return;
      }

      sockets.emit('blackjack:join', { lobbyId: currentLobby?.id, seatIndex });

      sockets.once('blackjack:join:error', (err) => {
        notify('error', { content: err.message, title: 'Error' });
      });
    },
    [credentials?.user, currentGame?.players, currentLobby?.id, currentLobby?.ownerId, openModal],
  );

  const handleLeaveSeat = useCallback(
    (seatIndex: number) => {
      sockets.emit('blackjack:leave', { lobbyId: currentLobby?.id, seatIndex });

      sockets.once('blackjack:leave:error', (err) => {
        notify('error', { content: err.message, title: 'Error' });
      });
    },
    [currentLobby?.id],
  );

  if (!currentGame || !currentLobby) return null;

  return (
    <div
      key={`table-seat-${i}`}
      className="absolute flex flex-col items-center justify-center"
      style={{
        left: `calc(50% + ${x}px - 42px)`,
        top: `calc(50% + ${y}px - 26px)`,
      }}
    >
      {seat ? (
        <div className="select-none">
          <div
            className={classNames(
              'relative h-[15px] w-[75px] items-center justify-center overflow-visible border-dashed',
              credentials?.user === seat.userId ? 'cursor-pointer' : '',
            )}
            style={{ transform: `rotate(${towardCenterDeg}deg)` }}
          >
            {seat.userId === currentGame?.currentPlayerId && currentGame?.status === BlackjackGameStatus.PLAYING && (
              <div
                className={classNames(
                  'absolute top-[-200px] z-10 w-full -translate-y-1/2',
                  seat.hands?.length === 1 ? 'left-1/2' : '',
                  seat.hands?.length === 2 && seat.hands?.[0]?.id === seat.currentHandId ? 'left-[-30px]' : '',
                  seat.hands?.length === 2 && seat.hands?.[1]?.id === seat.currentHandId ? 'left-[90px]' : '',
                )}
              >
                <img src={yourTurnArrowIcon} className="" alt="Bet Spot" />
              </div>
            )}
            {seat.hands?.length > 0 && (
              <div className="w-full">
                {seat.hands
                  .sort((hand1, hand2) => hand1.handIndex - hand2.handIndex)
                  .map((hand, handIndex) => (
                    <div key={`${hand.id}-${handIndex}`}>
                      {hand.hand.map((card, i) => (
                        <Card
                          key={`${hand.id}-${handIndex}-${i}`}
                          value={card}
                          cardGlow={currentGame?.currentPlayerId === seat?.userId && seat.currentHandId === hand.id}
                          className={classNames('absolute top-[40px] -translate-x-1/2 -translate-y-1/2')}
                          toX={(seat.hands?.length === 2 ? -30 : 20) + i * 30 + handIndex * 115}
                          toY={-(180 - i * 13)}
                          fromX={handIndex === 1 && i === 0 && seat.hands.length === 2 ? 20 : 50}
                          fromY={handIndex === 1 && i === 0 && seat.hands.length === 2 ? -180 : -500}
                          isFacedUp={handIndex === 1 && i === 0 && seat.hands?.length === 2}
                        />
                      ))}
                      {hand.hand?.length > 0 && (
                        <HandTotal
                          key={`${hand.id}-${handIndex}-total`}
                          cardsInHandLength={hand.hand.length}
                          handIndex={hand.handIndex}
                          handsLength={seat.hands.length}
                          totalValue={hand.handTotal}
                        />
                      )}
                    </div>
                  ))}
              </div>
            )}
            {currentLobby && !currentLobby.sideBets && (
              <>
                <div className="absolute top-[-40px] left-1/2 z-2 -translate-x-1/2 -translate-y-[50%]">
                  <img src={mainBetSvg} className="scale-[1.7]" alt="Bet Spot" />
                </div>
                {seat.userId === credentials?.user &&
                  (seat.userId !== currentGame?.currentPlayerId ||
                    currentGame?.status !== BlackjackGameStatus.PLAYING) && (
                    <div className="absolute top-[-40px] left-1/2 z-1 -translate-x-1/2 -translate-y-[50%]">
                      <img src={betsMainGlowCurrentBetting} className="scale-[5.7]" alt="Bet Spot" />
                    </div>
                  )}
                {seat.userId === currentGame?.currentPlayerId &&
                  currentGame?.status === BlackjackGameStatus.PLAYING && (
                    <div className="absolute top-[-40px] left-1/2 z-3 -translate-x-1/2 -translate-y-[50%]">
                      <img src={betsMainGlowCurrentPlaying} className="scale-[4.5]" alt="Bet Spot" />
                    </div>
                  )}
              </>
            )}
            {currentLobby && currentLobby.sideBets && (
              <>
                <div className="absolute top-[-40px] left-1/2 z-2 -translate-x-1/2 -translate-y-[50%]">
                  <img src={betsSpotRegular} className="scale-[4.6]" alt="Bet Spot" />
                </div>
                {seat.userId === credentials?.user && (
                  <div className="absolute top-[-40px] left-1/2 z-1 -translate-x-1/2 -translate-y-[50%]">
                    <img src={betsGlowCurrentBetting} className="scale-[5.7]" alt="Bet Spot" />
                  </div>
                )}
                {/* {seat.userId === currentGame?.currentPlayerId &&
                  currentGame?.status === BlackjackGameStatus.PLAYING && (
                    <div className="absolute top-[-40px] left-1/2 z-3 -translate-x-1/2 -translate-y-[50%]">
                      <img src={betsGlowCurrentPlaying} className="scale-[4.5]" alt="Bet Spot" />
                    </div>
                  )} */}

                <div
                  onClick={() =>
                    credentials?.user === seat.userId && onPlaceBet('side_21_3', currentLobby, currentGame)
                  }
                  className={classNames(
                    'absolute top-[-40px] left-1/2 z-50 -translate-x-[-35px] -translate-y-[18px]',
                    credentials?.user === seat.userId ? 'cursor-pointer' : '',
                  )}
                >
                  <img src={sideBet21_3Svg} className="scale-[2.3] opacity-0" alt="Bet Spot" />
                  {seat.bets?.some((bet) => bet.betPlace === 'side_21_3') && (
                    <BlackjackTwentyOneThreeAmount seat={seat} />
                  )}
                </div>
                <div
                  onClick={() =>
                    credentials?.user === seat.userId && onPlaceBet('perfect_pair', currentLobby, currentGame)
                  }
                  className={classNames(
                    'absolute top-[-40px] left-1/2 z-50 -translate-x-[75px] -translate-y-[18px]',
                    credentials?.user === seat.userId ? 'cursor-pointer' : '',
                  )}
                >
                  <img src={sideBetPerfectPairSvg} className="scale-[2.3] opacity-0" alt="Bet Spot" />

                  {seat.bets?.some((bet) => bet.betPlace === 'perfect_pair') && (
                    <BlackjackPerfectPairBetAmount seat={seat} />
                  )}
                </div>
              </>
            )}

            <div
              onClick={() => credentials?.user === seat.userId && onPlaceBet('main', currentLobby, currentGame)}
              className={classNames(
                'absolute top-[-40px] left-1/2 z-50 translate-x-[-18.5px] -translate-y-1/2 overflow-visible',
                credentials?.user === seat.userId ? 'cursor-pointer' : '',
              )}
            >
              <img className="scale-[1.1] opacity-0" src={mainBetSvg} alt="Bet Spot" />
              {seat.bets?.some((bet) => bet.betPlace === 'main') && <BlackjackMainBetAmount seat={seat} />}
            </div>
          </div>
          <div className="absolute left-[10px] ml-[-10px] flex w-full flex-col items-center justify-center">
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (credentials?.user === seat.userId) {
                  onPlaceBet('main', currentLobby, currentGame);
                }
              }}
              className={classNames(
                'relative flex h-[84px] w-[84px] items-center justify-center rounded-full border-2 border-dashed border-[#60A4FD] bg-[#4486DD29]',
                credentials?.user === seat.userId ? 'cursor-pointer' : '',
              )}
              style={{ transform: `rotate(${towardCenterDeg}deg)` }}
            >
              <img
                className="absolute left-1/2 -translate-x-1/2"
                style={{ transform: `rotate(${-towardCenterDeg}deg)` }}
                src={profileIcon}
                alt="Profile Icon"
              />
            </div>
            <div className="absolute top-[95px] text-[13px] font-extrabold text-white">{seat.username}</div>
            {credentials?.user === seat.userId &&
              seat.bets.length === 0 &&
              (currentGame.status === BlackjackGameStatus.COUNTDOWN ||
                currentGame.status === BlackjackGameStatus.WAITING_BETS ||
                currentGame.status === BlackjackGameStatus.WAITING_PLAYERS) && (
                <button onClick={() => handleLeaveSeat(i)} className="bet-control-leave absolute top-[120px]">
                  Leave
                </button>
              )}
          </div>
        </div>
      ) : (
        <div
          className={classNames(
            currentGame?.players?.some((player) => player.userId === credentials?.user) ||
              currentLobby?.ownerId === credentials?.user
              ? 'cursor-default opacity-[0.5] select-none'
              : 'cursor-pointer hover:scale-[1.05] hover:shadow-md',
          )}
        >
          <div
            onClick={() => (currentGame?.status !== BlackjackGameStatus.PLAYING ? handleJoinSeat(i) : undefined)}
            className={classNames(
              'flex h-[84px] w-[84px] flex-col items-center justify-center gap-[7px] rounded-full bg-[linear-gradient(0deg,rgba(78,200,125,0.16),rgba(78,200,125,0.16)),radial-gradient(89.48%_100%_at_50%_100%,rgba(78,200,125,0.36)_0%,rgba(0,0,0,0)_100%)] text-[16px] font-bold text-[#4EC87D] transition-transform duration-200 ease-in-out',
              {
                'cursor-not-allowed opacity-50':
                  currentGame?.status !== BlackjackGameStatus.COUNTDOWN &&
                  currentGame?.status !== BlackjackGameStatus.WAITING_PLAYERS &&
                  currentGame?.status !== BlackjackGameStatus.WAITING_BETS,
              },
            )}
          >
            <img src={joinTableIcon} alt="Join Table" />
            Join
          </div>
          <div className="pt-2 text-[13px] font-extrabold text-[#6E88AF] select-none">Empty Seat</div>
        </div>
      )}
    </div>
  );
};
