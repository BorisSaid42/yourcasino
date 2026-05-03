import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import greenDollarIcon from '../../assets/icons/common/dollar-icon-green.svg';
import walletIcon from '../../assets/icons/wallet-icon.svg';
import dollarIcon from '../../assets/icons/common/dollar-icon.svg';
import redDollarIcon from '../../assets/icons/statistics/red-dollar-icon.svg';
import editLobbyIcon from '../../assets/icons/lobby/edit-lobby-icon.svg';
import blueDollarIcon from '../../assets/icons/common/dollar-icon-large.svg';
import aceIcon from '../../assets/icons/common/ace-icon.svg';
import timePassedIcon from '../../assets/icons/lobby/time-passed-icon.svg';
import { LobbyType, useLobbyStatistics } from '../../queries/lobby';
import { use, useCallback, useEffect, useRef } from 'react';
import privateLobbyIcon from '../../assets/icons/lobby/private-lobby-icon.svg';
import sidebetsIcon from '../../assets/icons/lobby/sidebets-icon.svg';
import { ModalContext } from '../../providers/modal/context';
import { classNames, formatTimeAgo } from '../../lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CustomTooltip = ({ active, payload }: { active: boolean; payload: any }) => {
  if (active && payload && payload.length) {
    const value = +payload[0].value;
    const timeAgo = formatTimeAgo(payload[0].payload.name);

    return (
      <div className="flex flex-col rounded-md border border-[#253C60] bg-[#253C60] px-3 py-2 text-sm text-white">
        <div className="font-bold" style={{ color: value >= 0 ? '#4EC87D' : '#FF3C48' }}>
          {value >= 0 ? '+' : '-'}$
          {Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] font-medium text-[#6E88AF]">{timeAgo}</div>
      </div>
    );
  }
  return null;
};

export const LobbyOwnerStatisticsSidebar = ({
  lobbyDatails,
  game,
}: {
  lobbyDatails: LobbyType;
  game: 'blackjack' | 'roulette';
}) => {
  const { data } = useLobbyStatistics(lobbyDatails?.id, game);
  const { openModal } = use(ModalContext);
  const runningForRef = useRef<HTMLSpanElement>(null);

  const netProfit = data?.netProfit ?? 0;

  const isPositive = netProfit > 0;
  const isNegative = netProfit < 0;
  const sign = isPositive ? '+' : isNegative ? '-' : '';

  const icon = isPositive ? greenDollarIcon : isNegative ? redDollarIcon : dollarIcon;

  const textColor = isPositive ? 'text-[#4EC87D]' : isNegative ? 'text-[#FF5656]' : 'text-white';
  const bgColor = isPositive ? 'bg-[#1E4250]' : isNegative ? 'bg-[#5f404875]' : 'bg-[#253C60]';

  useEffect(() => {
    const interval = setInterval(() => {
      if (!data || !data?.activatedAt) return;
      const diffMs = Date.now() - new Date(data?.activatedAt).getTime();

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = String(Math.floor((diffMs / (1000 * 60 * 60)) % 24)).padStart(2, '0');
      const minutes = String(Math.floor((diffMs / (1000 * 60)) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((diffMs / 1000) % 60)).padStart(2, '0');

      if (runningForRef.current) {
        if (days > 0) {
          runningForRef.current.textContent = `${days}d ${hours}:${minutes}:${seconds}`;
        } else {
          runningForRef.current.textContent = `${hours}:${minutes}:${seconds}`;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  const handleOpenEditLobbyModal = useCallback(
    (lobbyId: string) => {
      return openModal({
        key: 'edit-lobby',
        props: { lobbyId },
        closable: true,
      });
    },
    [openModal],
  );

  const handleOpenAddBankrollModal = useCallback(
    (code: string) => {
      return openModal({
        key: 'add-bankroll-funds',
        props: { code, game },
        closable: true,
        lightBlur: true,
      });
    },
    [game, openModal],
  );

  return (
    <div className="mt-12 mr-12 flex h-[500px] min-w-[190px] flex-col gap-6">
      <div
        onClick={() => handleOpenAddBankrollModal(lobbyDatails?.code)}
        className="nav-button flex items-center gap-2 !bg-[#4486DD] px-3 py-4 text-sm font-bold"
      >
        <img src={walletIcon} alt="bankroll top up" /> Bankroll Balance
      </div>
      <div
        onClick={() => handleOpenEditLobbyModal(lobbyDatails?.id)}
        className="nav-button flex items-center gap-2 !bg-[#4486DD] px-3 py-4 text-sm font-bold"
      >
        <img src={editLobbyIcon} alt="eddit lobby" /> Edit Table Settings
      </div>
      {data && (
        <>
          <div className="flex flex-col">
            <span className="mb-3 text-xs font-extrabold">Statistics Overview</span>
            <div className="flex min-h-[180px] flex-col">
              <div className="min-h-[124px] rounded-t-[5px] border border-[#253C60] bg-[#08152A] p-2">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={data.gameStats}>
                    <Tooltip cursor={{ fill: 'transparent' }} content={(props) => <CustomTooltip {...props} />} />
                    <ReferenceLine y={0} stroke="#253C60" strokeWidth={2} />
                    <Bar dataKey="value" radius={[0, 0, 0, 0]} isAnimationActive={false} activeBar={false}>
                      {data.gameStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#4EC87D' : '#253C60'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={classNames('flex gap-4 rounded-b-[5px] px-5 py-2', bgColor)}>
                <div className="flex w-[22px] items-center">
                  <img src={icon} alt="green dollar icon" />
                </div>
                <div className="flex flex-col">
                  <span className={classNames('text-xs font-extrabold', textColor)}>Net Profit</span>
                  <span className="text-base font-bold">
                    {sign}$
                    {Math.abs(data.netProfit).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-4 rounded-[5px] bg-[#253C60] px-5 py-2">
              <div className="flex w-[22px] items-center">
                <img src={blueDollarIcon} alt="dollar icon" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-[#6D8AB7]">Wagered</span>
                <span className="text-base font-bold">
                  ${data.wagered.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex gap-4 rounded-[5px] bg-[#253C60] px-5 py-2">
              <div className="flex w-[22px] items-center">
                <img width={22} src={aceIcon} alt="ace icon" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-[#6D8AB7]">Total Bets</span>
                <span className="text-base font-bold">{data.totalBets}</span>
              </div>
            </div>
            <div className="flex gap-4 rounded-[5px] bg-[#253C60] px-5 py-2">
              <div className="flex w-[22px] items-center">
                <img width={22} src={timePassedIcon} alt="ace icon" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-[#6D8AB7]">Running for</span>
                <span className="text-base font-bold" ref={runningForRef}>
                  --:--:--
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-4 rounded-[5px] bg-[#253C605C] px-5 py-2">
              <div className="flex w-[22px] items-center">
                <img width={22} src={privateLobbyIcon} alt="ace icon" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-[#6D8AB7]">Private Table</span>
                <span className="text-base font-bold">{lobbyDatails.isPrivate ? 'ON' : 'OFF'}</span>
              </div>
            </div>
            {game === 'blackjack' && (
              <div className="flex gap-4 rounded-[5px] bg-[#253C605C] px-5 py-2">
                <div className="flex w-[22px] items-center">
                  <img width={22} src={sidebetsIcon} alt="ace icon" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-[#6D8AB7]">Side Bets</span>
                  <span className="text-base font-bold">{lobbyDatails.sideBets ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
