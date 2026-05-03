import aceIcon from '../../../assets/icons/common/ace-icon.svg';
import bankIcon from '../../../assets/icons/common/bank-icon.svg';
import crossIconRed from '../../../assets/icons/common/cross-icon-red.svg';
import { classNames, formatBalance } from '../../../lib/utils';
import { LobbyState } from '../../../queries/lobby';
import { IManageTablesRow } from './manage-tables-row';

export const ManageTablesRowMobile = ({ tableData, handleLobbyClick }: IManageTablesRow) => {
  const netProfit = tableData?.netProfit ?? 0;

  const isPositive = netProfit > 0;
  const isNegative = netProfit < 0;
  const sign = isPositive ? '+' : isNegative ? '-' : '';

  const textColor = isPositive ? 'text-[#4EC87D]' : isNegative ? 'text-[#FF5656]' : 'text-white';
  const bgColor = isPositive ? 'bg-[#1E4250]' : isNegative ? 'bg-[#5f404875]' : 'bg-[#3B557D]';

  return (
    <div className="flex flex-col rounded-[5px] bg-[#253C60]">
      <div className="flex gap-3 bg-[#00000014] px-4 py-3">
        <img className="mr-3" width={22} src={aceIcon} />
        <div className="flex flex-col">
          <div className="font-extrabold">{tableData.name}</div>
          <div className={classNames('flex items-center gap-1 font-bold', textColor)}>
            PNL: {sign}$
            {Math.abs(tableData.netProfit).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className={classNames('rounded-[5px] px-1 py-0.5', bgColor)}>{tableData.profitPercentage}%</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={(e) => handleLobbyClick(e, tableData.code)}
            className="min-w-[64px] cursor-pointer rounded-[5px] bg-[#4486DD] px-4 py-1.5 font-bold"
          >
            Edit
          </button>
          <button className="flex min-h-7 w-8 items-center justify-center rounded-[5px] border border-[#FF5656]">
            <img className="mx-2.5 my-2" src={crossIconRed} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-5 px-4 py-3.5">
        <div className="flex flex-col text-[#60A4FD]">
          <div className="flex items-center gap-1 font-extrabold">
            <img src={bankIcon} />
            Bankroll
          </div>
          <div className="font-bold">${formatBalance(tableData.bankroll)}</div>
        </div>
        <div className="flex flex-col">
          <div className="font-extrabold text-[#6E88AF8F]">Min-Max</div>
          <div className="font-bold">
            ${tableData.minBet} - ${tableData.maxBet}
          </div>
        </div>
        {tableData?.status === LobbyState.ACTIVE ? <div></div> : <span className="max-sm:hidden"> Inactive</span>}
      </div>
    </div>
  );
};
