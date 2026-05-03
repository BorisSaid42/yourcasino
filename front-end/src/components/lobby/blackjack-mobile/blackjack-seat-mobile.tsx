import { BreakpointEnum, classNames, useBreakpoint } from '../../../lib/utils';
import { BlackjackGameStatus, useCurrentGame } from '../../../queries/blackjack';
import { Card } from '../card';
import { HandTotal } from '../hand-total';
import { LobbyMobilePlaceBetControll } from '../lobby-mobile-place-bet-controll';
import yourTurnArrowIcon from '../../../assets/table/your-turn-arrow.svg';
import profileIcon from '../../../assets/icons/common/profile-icon.svg';
import joinTableIcon from '../../../assets/icons/lobby/join-table-icon.svg';
import { useLobby } from '../../../providers/lobby/context';
import { useCredentials } from '../../../queries/auth';
import { useBlackjack } from '../../../providers/blackjack/context';
import { use } from 'react';
import { ModalContext } from '../../../providers/modal/context';

const SEAT_COUNT = 5;
const RADIUS_PERCENT = 42;

const SEATS_MAP = [
  { occupied: 'translate(-50%, -10%) rotate(0deg)', empty: 'translate(-50%, -30%) rotate(0deg)' },
  { occupied: 'translate(-75%, -10%) rotate(0deg)', empty: 'translate(-75%, -30%) rotate(0deg)' },
  { occupied: 'translate(-50%, -10%) rotate(0deg)', empty: 'translate(-50%, -30%) rotate(0deg)' },
  { occupied: 'translate(-25%, -10%) rotate(0deg)', empty: 'translate(-25%, -30%) rotate(0deg)' },
  { occupied: 'translate(-50%, -10%) rotate(0deg)', empty: 'translate(-50%, -30%) rotate(0deg)' },
];

export const BlackjackSeatMobile = ({ i }: { i: number }) => {
  const { lobby } = useLobby();
  const { data: currentGame } = useCurrentGame(lobby?.id);
  const isSmallerScreen = useBreakpoint(BreakpointEnum.XXS);
  const isTabletScreen = useBreakpoint(BreakpointEnum.MD);
  const { data: credentials } = useCredentials();
  const { handleJoinSeat, handleLeaveSeat } = useBlackjack();
  const { openModal } = use(ModalContext);

  const ellipseYScale = 0.9;
  const angleDeg = (i * 180) / (SEAT_COUNT - 1);
  const angleRad = (angleDeg * Math.PI) / 180;
  const x = 50 + RADIUS_PERCENT * Math.cos(angleRad);
  const y = 50 + RADIUS_PERCENT * ellipseYScale * Math.sin(angleRad);
  const rotate = angleDeg - 90;

  const occupiedSeat = currentGame?.players?.find((s) => s.seatIndex === i) ?? null;

  if (!lobby || !currentGame) return null;

  return (
    <div
      key={i}
      className="absolute flex flex-col max-sm:max-w-[100px] max-sm:items-center max-sm:gap-1"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `${occupiedSeat ? SEATS_MAP[i].occupied : SEATS_MAP[i].empty}`,

        transformOrigin: 'top right',
      }}
    >
      {occupiedSeat ? (
        <div className="relative z-30 flex flex-col items-center justify-center max-sm:max-w-[100px] max-sm:gap-4">
          {/* Seat Cards */}
          {occupiedSeat.hands?.length > 0 && (
            <div
              className={classNames(
                'absolute -top-2 left-[50px] z-30 flex w-full max-lg:scale-75 max-md:-top-2 max-sm:left-0 max-sm:scale-[0.4]',
                isSmallerScreen ? 'top-1!' : '',
              )}
              style={{ transform: `rotate(${(rotate * 1.2) / 2}deg)` }}
            >
              {occupiedSeat.userId === currentGame?.currentPlayerId &&
                currentGame?.status === BlackjackGameStatus.PLAYING && (
                  <div
                    className={classNames(
                      'absolute top-[-140px] z-30 min-w-3 -translate-y-1/2',
                      occupiedSeat.hands?.length === 1 ? 'left-[30px]' : '',
                      occupiedSeat.hands?.length === 2 && occupiedSeat.hands?.[0]?.id === occupiedSeat.currentHandId
                        ? 'left-[-30px]'
                        : '',
                      occupiedSeat.hands?.length === 2 && occupiedSeat.hands?.[1]?.id === occupiedSeat.currentHandId
                        ? 'left-[90px]'
                        : '',
                    )}
                  >
                    <img src={yourTurnArrowIcon} className="max-sm:scale-[1.5]" alt="Bet Spot" />
                  </div>
                )}
              {occupiedSeat.hands
                .sort((hand1, hand2) => hand1.handIndex - hand2.handIndex)
                .map((hand, handIndex) => (
                  <div key={`${hand.id}-${handIndex}`} style={{ zIndex: 50 + hand.handIndex }}>
                    {hand.hand?.map((card, i) => (
                      <Card
                        key={`dealer-card-${card}-${i}`}
                        value={card}
                        faceDown={!card}
                        cardGlow={
                          currentGame?.currentPlayerId === occupiedSeat?.userId &&
                          occupiedSeat.currentHandId === hand.id
                        }
                        className={classNames('absolute -translate-x-1/2 -translate-y-[50%]')}
                        toX={(occupiedSeat.hands?.length === 2 ? -35 : 30) + i * 30 + handIndex * 125}
                        toY={-(75 - 15 * i)}
                        fromX={handIndex === 1 && i === 0 && occupiedSeat.hands?.length === 2 ? 30 : 50}
                        fromY={handIndex === 1 && i === 0 && occupiedSeat.hands?.length === 2 ? -75 : -500}
                        initialOpacity={handIndex === 1 && i === 0 && occupiedSeat.hands?.length === 2 ? 1 : 0}
                        isFacedUp={handIndex === 1 && i === 0 && occupiedSeat.hands?.length === 2}
                      />
                    ))}
                    <HandTotal
                      cardsInHandLength={hand.hand.length}
                      handIndex={hand.handIndex}
                      handsLength={occupiedSeat.hands.length}
                      totalValue={hand.handTotal}
                      style={{
                        top: `-25px`,
                        left: `${(occupiedSeat.hands?.length === 2 ? -30 : 35) + handIndex * 115}px`,
                      }}
                    />
                  </div>
                ))}
            </div>
          )}
          {/* Seat Chips */}
          <LobbyMobilePlaceBetControll
            seat={occupiedSeat}
            styles={{
              transform: `rotate(${(rotate * 1.2) / 2}deg)`,
              scale: isSmallerScreen ? '0.35' : isTabletScreen ? '0.5' : '0.7',
              transformOrigin: 'center',
            }}
          />
          {/* SEAT */}
          <div className="relative mt-10 flex h-[84px] w-[84px] origin-center items-center justify-center rounded-full border-2 border-dashed border-[#60A4FD] bg-[#4486DD29] max-lg:scale-75 max-sm:mt-0 max-sm:h-[26px] max-sm:w-[26px] max-sm:scale-100">
            <img className="absolute left-1/2 -translate-x-1/2 max-sm:w-2" src={profileIcon} alt="Profile Icon" />
          </div>
        </div>
      ) : (
        <div
          onClick={() =>
            currentGame?.status !== BlackjackGameStatus.PLAYING
              ? handleJoinSeat(i, openModal, lobby, currentGame)
              : undefined
          }
          className={classNames(
            'flex h-[84px] w-[84px] flex-col items-center justify-center gap-[7px] rounded-full bg-[linear-gradient(0deg,rgba(78,200,125,0.16),rgba(78,200,125,0.16)),radial-gradient(89.48%_100%_at_50%_100%,rgba(78,200,125,0.36)_0%,rgba(0,0,0,0)_100%)] text-[16px] font-bold text-[#4EC87D] transition-transform duration-200 ease-in-out max-lg:scale-75 max-sm:scale-50',
            { 'opacity-50': currentGame?.status === BlackjackGameStatus.PLAYING },
            currentGame?.players?.some((player) => player.userId === credentials?.user) ||
              lobby?.ownerId === credentials?.user
              ? 'cursor-default opacity-[0.5] select-none'
              : 'cursor-pointer hover:scale-[1.05] hover:shadow-md',
          )}
        >
          <img src={joinTableIcon} alt="Join Table" />
          Join
        </div>
      )}

      <div className="pt-2 text-center text-[13px] font-extrabold text-white max-sm:p-0 max-sm:text-[8px]">
        {occupiedSeat?.username || 'Empty Seat'}
      </div>

      {occupiedSeat &&
        occupiedSeat.userId === credentials?.user &&
        occupiedSeat.bets.length === 0 &&
        (currentGame.status === BlackjackGameStatus.COUNTDOWN ||
          currentGame.status === BlackjackGameStatus.WAITING_BETS ||
          currentGame.status === BlackjackGameStatus.WAITING_PLAYERS) && (
          <button onClick={() => handleLeaveSeat(i, lobby.id)} className="bet-control-leave max-sm:w-fit">
            Leave
          </button>
        )}
    </div>
  );
};
