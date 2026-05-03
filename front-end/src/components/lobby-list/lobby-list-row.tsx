import { QueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import arrowRightIcon from '../../assets/icons/common/arrow-right.svg';
import profileIcon from '../../assets/icons/profile-icon.svg';
import aceIcon from '../../assets/logo-favicon.png';
import rouletteIcon from '../../assets/roulette/roulette-icon-blue.svg';
import { api } from '../../lib/interaction/api';
import { classNames, formatBalance } from '../../lib/utils';
import { LobbySortField, LobbyState, LobbyType } from '../../queries/lobby';
import { notify } from '../toast';
interface ILobbyListRowProps {
  lobbyRow: LobbyType;
  sortState?: LobbySortField;
  className?: string;
}

export const LobbyListRow = ({ lobbyRow, className = '', sortState = LobbySortField.BANKROLL }: ILobbyListRowProps) => {
  const navigate = useNavigate();

  const handleLobbyClick = useCallback(
    async (e: React.MouseEvent, code: string) => {
      const queryClient = new QueryClient();
      e.preventDefault();
      if (!code) return;

      try {
        await queryClient.fetchQuery({
          queryKey: ['lobby', 'details', code.toUpperCase()],
          queryFn: () => api.get<LobbyType, LobbyType>(`/lobby/${code}`),
        });

        navigate({ to: `/lobby/${code.toUpperCase()}` });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        notify('error', { content: 'Lobby not found or no longer available.', title: 'Error' });
      }
    },
    [navigate],
  );

  const isPaused = lobbyRow.status === LobbyState.PAUSED;

  return (
    <>
      {lobbyRow && (
        <div
          key={lobbyRow.id}
          onClick={(e) => handleLobbyClick(e, lobbyRow.code)}
          className={classNames(
            'mb-3 grid min-h-[72px] cursor-pointer grid-cols-[1fr_3fr_1fr_2fr_3fr_200px_1fr] overflow-hidden rounded-[5px] bg-[#152947] font-bold hover:bg-[#152947BB]',
            className,
          )}
        >
          <div className="flex items-center justify-center gap-2 bg-[#183052] px-5 text-center font-bold tracking-[2.5px]">
            {!lobbyRow.isBlackjackEnabled ? (
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="flex items-center gap-2">
                  <img width={14} src={profileIcon} /> {lobbyRow.roulettePlayerCount}
                </div>
                <span className="text-[10px] font-bold tracking-normal text-[#6E88AF]">Playing</span>
              </div>
            ) : (
              <>
                <img width={14} src={profileIcon} /> {lobbyRow.currentPlayerCount}/5{' '}
              </>
            )}
          </div>
          <div className="relative flex w-full items-center justify-center gap-3 text-center md:flex-col lg:flex-row">
            <div className="flex items-center gap-3">
              {lobbyRow.isBlackjackEnabled ? (
                <img width={18} src={aceIcon} />
              ) : (
                <img src={rouletteIcon} alt="roulette" />
              )}
              {lobbyRow.name}
            </div>
          </div>
          <div className="relative flex w-full items-center justify-center gap-3 text-center md:flex-col lg:flex-row">
            {isPaused && (
              <span
                className={classNames('rounded bg-[#FF3C48] px-2 py-0.5 text-xs font-semibold text-white md:static')}
              >
                PAUSED
              </span>
            )}
          </div>
          {lobbyRow.isBlackjackEnabled ? (
            <>
              <div
                className={`flex items-center justify-center text-center ${sortState === 'bankroll' ? 'text-[#60A4FD]' : ''}`}
              >
                $
                {lobbyRow.isBlackjackEnabled && lobbyRow.isRouletteEnabled
                  ? `${formatBalance(lobbyRow.summedBankroll)}`
                  : `${formatBalance(lobbyRow.bankroll)}`}
              </div>
              <div
                className={`flex items-center justify-center text-center ${sortState === 'minBet' || sortState === 'maxBet' ? 'text-[#60A4FD]' : ''}`}
              >
                ${lobbyRow.minBet} - ${lobbyRow.maxBet}
              </div>
            </>
          ) : (
            <>
              <div
                className={`flex items-center justify-center text-center ${sortState === 'bankroll' ? 'text-[#60A4FD]' : ''}`}
              >
                ${formatBalance(lobbyRow.rouletteBankroll)}
              </div>
              <div
                className={`flex items-center justify-center text-center ${sortState === 'minBet' || sortState === 'maxBet' ? 'text-[#60A4FD]' : ''}`}
              >
                ${lobbyRow.rouletteMinBet} - ${lobbyRow.rouletteMaxBet}
              </div>
            </>
          )}

          <div className="my-auto w-full truncate overflow-hidden text-center text-[#6E88AF]">{lobbyRow.owner}</div>
          <div className="flex items-center justify-center px-4 text-center">
            <button className="hover-base flex h-10 w-12 cursor-pointer items-center justify-center bg-[#182E51]">
              <img src={arrowRightIcon} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
