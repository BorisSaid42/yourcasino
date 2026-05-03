import { use, useCallback } from 'react';
import { LobbyType } from '../../../queries/lobby';
import { sockets } from '../../../lib/interaction/sockets';
import { useCredentials } from '../../../queries/auth';
import { SocketLockContext } from '../../../providers/socket-locks/context';
import { useCurrentGame } from '../../../queries/blackjack';
import { classNames } from '../../../lib/utils';
import minusIcon from '../../../assets/icons/common/minus-icon.svg';
import plusIcon from '../../../assets/icons/common/plus-icon.svg';
import splitLeft from '../../../assets/icons/common/split-left.svg';
import splitRight from '../../../assets/icons/common/split-right.svg';

export const BlackjackBetOptions = ({ lobby }: { lobby: LobbyType }) => {
  const { data: currentGame } = useCurrentGame(lobby?.id);
  const { data: credentials } = useCredentials();
  const { isLocked, setLock } = use(SocketLockContext);

  const checkForDoubleDown = useCallback(() => {
    if (!lobby) return;
    const userPlaying = currentGame?.players?.find((player) => player.userId === credentials?.user);

    if (!userPlaying) return false;
    const userHandPlaying = userPlaying.hands.find((hand) => userPlaying.currentHandId === hand.id);

    if (!userHandPlaying) return false;

    if (userHandPlaying.hasSplitted) return false;

    if (userHandPlaying.hand.length === 2 && userHandPlaying.handTotal < 21) return true;

    return false;
  }, [credentials?.user, currentGame?.players, lobby]);

  const checkForSplit = useCallback(() => {
    if (!lobby) return;
    const userPlaying = currentGame?.players?.find((player) => player.userId === credentials?.user);

    if (!userPlaying) return false;

    const userHandPlaying = userPlaying.hands.find((hand) => userPlaying.currentHandId === hand.id);

    if (!userHandPlaying) return false;

    if (userHandPlaying.hasSplitted || userHandPlaying.hand.length !== 2 || userHandPlaying.handTotal > 20)
      return false;

    const firstCardValue = userHandPlaying.hand[0].slice(0, 1);
    const secondCardValue = userHandPlaying.hand[1].slice(0, 1);

    if (firstCardValue === secondCardValue) return true;

    return false;
  }, [credentials?.user, currentGame?.players, lobby]);

  const handleDoubleDown = useCallback(() => {
    if (!lobby?.id || !checkForDoubleDown()) return;
    sockets.emit('blackjack:action:double', { lobbyId: lobby.id, userId: credentials?.user });
  }, [checkForDoubleDown, credentials?.user, lobby.id]);

  const handleHit = useCallback(() => {
    if (!lobby?.id || isLocked('player-hit')) return;
    setLock('player-hit', true);
    sockets.emit('blackjack:action:hit', { lobbyId: lobby.id, userId: credentials?.user });
  }, [credentials?.user, isLocked, lobby.id, setLock]);

  const handleStand = useCallback(() => {
    if (!lobby?.id || isLocked('player-stand')) return;
    setLock('player-stand', true);
    sockets.emit('blackjack:action:stand', { lobbyId: lobby.id, userId: credentials?.user });
  }, [credentials?.user, isLocked, lobby.id, setLock]);

  const handleSplit = useCallback(() => {
    if (!lobby?.id || !checkForSplit()) return;
    sockets.emit('blackjack:action:split', { lobbyId: lobby.id, userId: credentials?.user });
  }, [checkForSplit, credentials?.user, lobby.id]);

  return (
    <div className="flex justify-center gap-4 select-none">
      <div
        onClick={handleDoubleDown}
        className={classNames(
          'flex h-18 w-18 flex-col items-center justify-center gap-[3px] rounded-xl bg-[#B55D26] text-white',
          checkForDoubleDown() ? 'cursor-pointer' : 'opacity-[0.5] select-none',
        )}
      >
        <span className="text-center text-xs font-bold">X2</span>
        <span className="justify-center text-center text-[9px] font-black">DOUBLE DOWN</span>
      </div>
      <div
        onClick={handleHit}
        className={classNames(
          'flex h-18 w-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-[#00CF56] text-[13px] font-black text-white',
          isLocked('player-hit') ? 'cursor-default opacity-[0.5]' : '',
        )}
      >
        <img src={plusIcon} alt="plus" />
        HIT
      </div>
      <div
        onClick={handleStand}
        className={classNames(
          'flex h-18 w-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-[#DE1432] text-[11px] font-black text-white',
          isLocked('player-stand') ? 'cursor-default opacity-[0.5]' : '',
        )}
      >
        <img src={minusIcon} alt="minus" />
        STAND
      </div>
      <div
        onClick={handleSplit}
        className={classNames(
          'flex h-18 w-18 flex-col items-center justify-center gap-2 rounded-xl bg-[#479FBF] text-[11px] font-black text-white',
          checkForSplit() ? 'cursor-pointer' : 'opacity-[0.5] select-none',
        )}
      >
        <div className="flex gap-1">
          <img src={splitLeft} alt="split-left" />
          <img src={splitRight} alt="split-right" />
        </div>
        SPLIT
      </div>
    </div>
  );
};
