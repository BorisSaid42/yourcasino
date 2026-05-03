import { useNavigate } from '@tanstack/react-router';
import { use, useEffect } from 'react';
import dealNowSound from '../../../assets/deal-now.mp3';
import winSound from '../../../assets/win-sound.mp3';
import { sockets } from '../../../lib/interaction/sockets';
import { socketJoinLeaveEmit } from '../../../lib/sockets';
import { BreakpointEnum, useBreakpoint } from '../../../lib/utils';
import { useLobby } from '../../../providers/lobby/context';
import { ModalContext } from '../../../providers/modal/context';
import { resourceManager } from '../../../providers/resource-manager';
import { useRoulette } from '../../../providers/roulette/context';
import { useCredentials } from '../../../queries/auth';
import { LobbyOwnerStatisticsSidebar } from '../lobby-owner-statistics-sidebar';
import { BetsList } from './bets-list';
import { RouletteWrapper } from './roullete-wrapper';
import rouletteSpinSound from '../../../assets/roulette/roulette_spin.mp3';
import fallIntoPocketSound from '../../../assets/roulette/fall_into_pocket.mp3';
import demoPocketSound from '../../../assets/roulette/roulette_pocket_demo.mp3';
import { LobbyGame, LobbyState } from '../../../queries/lobby';
import { useCurrentGame } from '../../../queries/roulette';
import { LobbyOwnerStatisticsMobile } from '../lobby-owner-statistics-mobile';
import { useUser } from '../../../queries/user';

export interface IRouletteLobby {
  bankroll: number;
  minBet: number;
  maxBet: number;
  lobbyCode: string;
  inviteLink: string;
  isPrivate: boolean;
  isSideBetsAllowed: boolean;
  host: string;
}

export const RoulettePage = () => {
  const { lobby } = useLobby();
  const navigate = useNavigate();
  const { handleChangeCurrentLobbyId, selectedChipAmount, handleChangeSelectedChipAmount, currentLobbyId } =
    useRoulette();
  const isSmallerScreen = useBreakpoint(BreakpointEnum.XL);
  const { data: credentials } = useCredentials();
  const { openModal } = use(ModalContext);
  const { data: currentGame } = useCurrentGame(currentLobbyId);
  const { data: user } = useUser();

  useEffect(() => {
    if (!lobby?.id) return;

    const handleJoin = () => {
      sockets.emit('roulette:room:join', { lobbyId: lobby?.id });
    };
    const handleLeave = () => {
      sockets.emit('roulette:room:leave', { lobbyId: lobby?.id });
    };

    return socketJoinLeaveEmit('roulette', handleJoin, handleLeave);
  }, [lobby?.id]);

  useEffect(() => {
    if (
      lobby &&
      ((!currentGame && lobby.status !== LobbyState.ACTIVE) || (currentGame && lobby.status === LobbyState.PAUSED))
    ) {
      openModal({ key: 'lobby-deactivated', props: { code: lobby.code }, closable: false, lightBlur: true });
    }
  }, [currentGame, lobby, lobby?.code, lobby?.status, openModal]);

  useEffect(() => {
    if (!lobby) return;

    handleChangeCurrentLobbyId(lobby.id);

    if (!lobby.isRouletteEnabled) {
      navigate({ to: `/lobby/${lobby.code}/` });
    }
  }, [handleChangeCurrentLobbyId, lobby, navigate]);

  useEffect(() => {
    if (selectedChipAmount > 0) return;
    if (!lobby || !credentials?.user || !user || !currentGame) return;

    const availableChips = [0.5, 1, 5, 10, 25, 50, 100];
    const userBalance = user.balance;
    const minBet = lobby.rouletteMinBet;
    const maxBet = lobby.rouletteMaxBet;

    const optimalChip = availableChips
      .filter((chip) => chip >= minBet && chip <= maxBet && chip <= userBalance)
      .sort((a, b) => a - b)[0];

    if (optimalChip) {
      handleChangeSelectedChipAmount(optimalChip);
    } else {
      handleChangeSelectedChipAmount(availableChips[0]);
    }
  }, [selectedChipAmount, lobby, credentials?.user, user, currentGame, handleChangeSelectedChipAmount]);

  useEffect(() => {
    Promise.all([
      resourceManager.loadAudio('deal-now', dealNowSound),
      resourceManager.loadAudio('win-sound', winSound),
      resourceManager.loadAudio('roulette-spin', rouletteSpinSound),
      resourceManager.loadAudio('fall-into-pocket', fallIntoPocketSound),
      resourceManager.loadAudio('pocket-demo', demoPocketSound),
    ]).catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (!lobby || !lobby.isRouletteEnabled || lobby.rouletteBankroll > lobby.rouletteMinBet) return;

    const canPlayBlackjack = lobby.isBlackjackEnabled && lobby.bankroll > lobby.minBet;

    openModal({
      key: 'bankroll-insufficient-funds',
      props: { code: lobby.code, game: LobbyGame.ROULETTE, canPlayBlackjack },
      closable: false,
      lightBlur: true,
    });
  }, [lobby, openModal]);

  return (
    <div className="min-h-[calc(100vh)]">
      <div className="flex gap-9 px-9 py-12 max-xl:py-2.5 max-lg:px-3">
        <BetsList />
        <RouletteWrapper />

        {credentials?.user === lobby?.ownerId && !isSmallerScreen && (
          <LobbyOwnerStatisticsSidebar lobbyDatails={lobby} game="roulette" />
        )}
      </div>
      {credentials?.user === lobby?.ownerId && isSmallerScreen && (
        <div className="p-5">
          <LobbyOwnerStatisticsMobile game="roulette" lobbyDatails={lobby} />
        </div>
      )}
    </div>
  );
};
