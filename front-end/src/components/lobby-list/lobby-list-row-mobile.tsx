import { QueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import arrowRightIcon from '../../assets/icons/common/arrow-right.svg';
import bankIcon from '../../assets/icons/common/bank-icon.svg';
import personIcon from '../../assets/icons/profile-icon.svg';
import aceIcon from '../../assets/logo-favicon.png';
import { api } from '../../lib/interaction/api';
import { classNames, formatBalance } from '../../lib/utils';
import { LobbyState, LobbyType } from '../../queries/lobby';
import { notify } from '../toast';
import { useCallback } from 'react';

interface ILobbyListRowMobileProps {
  lobbyRow: LobbyType;
  className?: string;
}

export const LobbyListRowMobile = ({ lobbyRow, className = '' }: ILobbyListRowMobileProps) => {
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
          onClick={(e) => handleLobbyClick(e, lobbyRow.code)}
          className={classNames('mt-6 mb-3 flex cursor-pointer flex-col rounded-[5px] bg-[#152947]', className)}
        >
          <div className="flex flex-row justify-between bg-[#00000014] px-4 py-3">
            <div className="flex items-center gap-3">
              <img className="max-w-[22px]" src={aceIcon} />
              <div className="flex flex-col max-sm:text-xs">
                <div className="font-extrabold">{lobbyRow.name}</div>
                <div className="font-bold text-[#6E88AF]">{lobbyRow.owner}</div>
              </div>
              {isPaused && (
                <span className="ml-2 self-center rounded bg-[#FF3C48] px-2 py-0.5 text-xs font-semibold text-white">
                  PAUSED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-[5px] bg-[#183052] p-2 font-bold tracking-[2.5px]">
              <img className="max-w-3" src={personIcon} />
              <div>{lobbyRow.currentPlayerCount}/5</div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            {lobbyRow.isBlackjackEnabled ? (
              <div className="flex gap-5">
                <div className="font-extrabold text-[#60A4FD]">
                  <div className="flex items-center gap-[5px]">
                    <img src={bankIcon} />
                    <div>Bankroll</div>
                  </div>
                  <div>
                    $
                    {lobbyRow.isBlackjackEnabled && lobbyRow.isRouletteEnabled
                      ? `${formatBalance(lobbyRow.summedBankroll)}`
                      : `${formatBalance(lobbyRow.bankroll)}`}
                  </div>
                </div>
                <div className="flex flex-col font-extrabold">
                  <span className="text-[#6E88AF8F]">Min-Max</span>
                  <span className="font-bold text-white">
                    ${lobbyRow.minBet} - ${lobbyRow.maxBet}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex gap-5">
                <div className="font-extrabold text-[#60A4FD]">
                  <div className="flex items-center gap-[5px]">
                    <img src={bankIcon} />
                    <div>Bankroll</div>
                  </div>
                  <div>${formatBalance(lobbyRow.rouletteBankroll)}</div>
                </div>
                <div className="flex flex-col font-extrabold">
                  <span className="text-[#6E88AF8F]">Min-Max</span>
                  <span className="font-bold text-white">
                    ${lobbyRow.rouletteMinBet} - ${lobbyRow.rouletteMaxBet}
                  </span>
                </div>
              </div>
            )}
            <button className="cursor-pointer rounded-[5px] bg-[#182E51] px-4 py-3">
              <img src={arrowRightIcon} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
