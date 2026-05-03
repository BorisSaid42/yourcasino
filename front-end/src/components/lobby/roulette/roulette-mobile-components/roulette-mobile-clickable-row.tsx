import { classNames } from '../../../../lib/utils';
import { RouletteUserBet } from '../../../../queries/roulette';
import { ClickableBoardField } from '../clickable-board-components/clickable-board-field';
import { IClickableRowArray } from '../roullete-board-clickable-fileds';

export const RouletteMobileClickableRow = ({
  className,
  fields,
  onMouseEnter,
  onMouseLeave,
  selectedChipAmount,
  userBets,
}: {
  className?: string;
  fields: IClickableRowArray[];
  onMouseEnter?: (field: string) => void;
  onMouseLeave?: () => void;
  selectedChipAmount: number;
  userBets?: RouletteUserBet[];
}) => {
  return (
    <div className={classNames('relative w-full border-0 border-green-400', className)}>
      {fields.map((position, idx) => {
        return (
          <div key={`clickable-row-${position.values[0]}`}>
            {position?.values?.[0] !== undefined && (
              <ClickableBoardField
                values={position.values[0]}
                key={`clickable-field-${position.values[0]}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                selectedChipAmount={selectedChipAmount}
                className="absolute flex h-[21px] w-full cursor-pointer items-center justify-center border-0 border-pink-400"
                style={{ top: `${idx * 31.5 + 3}px`, right: 0 }}
                userBets={userBets}
              />
            )}
            {position.values?.[1] && (
              <ClickableBoardField
                values={position.values[1]}
                key={`clickable-field-${position.values[1]}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                selectedChipAmount={selectedChipAmount}
                className="absolute h-[12px] w-full cursor-pointer border-0"
                style={{ top: `${idx * 31.5 + (position?.values?.[0] !== undefined ? 24 : 24)}px`, right: 0 }}
                userBets={userBets}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
