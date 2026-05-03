import { use, useEffect, useMemo } from 'react';
import chip0_5 from '../../assets/icons/chip/chip-0_5.svg';
import chip1 from '../../assets/icons/chip/chip-1.svg';
import chip10 from '../../assets/icons/chip/chip-10.svg';
import chip100 from '../../assets/icons/chip/chip-100.svg';
import chip25 from '../../assets/icons/chip/chip-25.svg';
import chip5 from '../../assets/icons/chip/chip-5.svg';
import chip50 from '../../assets/icons/chip/chip-50.svg';
import { sockets } from '../../lib/interaction/sockets';
import { ModalContext } from '../../providers/modal/context';
import { useCredentials } from '../../queries/auth';
import { BlackjackLobbySeat } from './blackjack-desktop/blackjack-lobby-seat';

export const chipMap: Record<number, string> = {
  0.5: chip0_5,
  1: chip1,
  5: chip5,
  10: chip10,
  25: chip25,
  50: chip50,
  100: chip100,
};

export const TableSeats = () => {
  const { data: credentials } = useCredentials();
  const { openModal } = use(ModalContext);

  const angles = useMemo(() => [0.18, 0.33, 0.5, 0.67, 0.82], []);

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

  return (
    <div className="absolute top-25 left-1/2 h-[548px] w-full max-w-[1200px] -translate-x-1/2 -translate-y-1/2 select-none">
      {angles.map((t, i) => (
        <BlackjackLobbySeat key={`blackjack-lobby-seat-${i}`} i={i} t={t} />
      ))}
    </div>
  );
};
