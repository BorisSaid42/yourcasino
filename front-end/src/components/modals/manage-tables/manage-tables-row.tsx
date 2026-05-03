import aceIconGray from '../../../assets/icons/common/ace-icon-gray.svg';
import aceIcon from '../../../assets/icons/common/ace-icon.svg';
import { classNames, formatBalance } from '../../../lib/utils';
import { LobbyState, LobbyStats } from '../../../queries/lobby';

export interface IManageTablesRow {
  idx: number;
  tableData: LobbyStats;
  handleLobbyClick: (e: React.MouseEvent, code: string) => void;
}

export const ManageTablesRow = ({ idx, tableData, handleLobbyClick }: IManageTablesRow) => {
  const netProfit = tableData?.netProfit ?? 0;

  const isPositive = netProfit > 0;
  const isNegative = netProfit < 0;
  const sign = isPositive ? '+' : isNegative ? '-' : '';

  const textColor = isPositive ? 'text-[#4EC87D]' : isNegative ? 'text-[#FF5656]' : 'text-white';
  const bgColor = isPositive ? 'bg-[#1E4250]' : isNegative ? 'bg-[#5f404875]' : 'bg-[#3B557D]';

  return (
    <div
      className="grid grid-cols-[5fr_1fr_2fr_2fr_2fr_3fr] gap-2 rounded-lg bg-[#253C60] px-3 py-2.5"
      key={`manage-table-row-${idx}`}
    >
      <div className="flex items-center justify-between text-xs font-bold">
        <img width={18} src={tableData?.status === LobbyState.ACTIVE ? aceIcon : aceIconGray} className="mr-3" />
        <span className={classNames(tableData?.status !== LobbyState.ACTIVE ? 'bg-[#fff0] text-[#465B7C]' : '')}>
          {tableData.name}{' '}
        </span>
        <span
          className={classNames(
            'mr-3 ml-2 rounded-[5px] bg-[#3B557D] px-[5px] py-0.5 text-[10px]',
            tableData?.status !== LobbyState.ACTIVE ? 'bg-[#fff0] text-[#465B7C]' : '',
          )}
        >
          #{tableData.code}
        </span>
      </div>
      {tableData?.status === LobbyState.ACTIVE ? (
        <div></div>
      ) : (
        <span className="self-center text-[#465B7C] max-sm:hidden"> Inactive</span>
      )}
      <div className="flex items-center text-sm font-bold">
        ${tableData.minBet.toLocaleString()}-${tableData.maxBet.toLocaleString()}
      </div>
      <div className="flex items-center gap-2 text-sm font-bold">
        ${formatBalance(tableData.bankroll)}{' '}
        <span className={classNames('rounded-[5px] px-[5px] py-0.5 text-xs', textColor, bgColor)}>
          {tableData.profitPercentage}%
        </span>
      </div>
      <div className={classNames('self-center text-sm font-bold', textColor)}>
        {sign}$
        {Math.abs(tableData.netProfit).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={(e) => handleLobbyClick(e, tableData.code)}
          className="cursor-pointer rounded-[5px] bg-[#4486DD] px-2 py-[5px] text-sm font-bold duration-500 hover:bg-[#5898E6]"
        >
          Edit Settings
        </button>
        {/* <Link
          to={tableData.inviteLink}
          className="cursor-pointer rounded-[5px] bg-[#4486DD] px-2 py-[5px] text-sm font-bold duration-500 hover:bg-[#5898E6]"
        >
          Edit Settings
        </Link> */}
      </div>
    </div>
  );
};
