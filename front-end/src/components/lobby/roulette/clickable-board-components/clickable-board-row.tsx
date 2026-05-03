import { classNames } from '../../../../lib/utils';
import { RouletteUserBet } from '../../../../queries/roulette';
import { IClickableRowArray } from '../roullete-board-clickable-fileds';
import { ClickableBoardField } from './clickable-board-field';

export const RouletteClickableRow = ({
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
                className="absolute flex h-full w-[54px] cursor-pointer items-center justify-center border-0 border-pink-400"
                style={{ left: `${idx * 65}px` }}
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
                className="absolute h-full w-[12px] cursor-pointer border-0"
                style={{ left: `${idx * 65 + (position?.values?.[0] !== undefined ? 54 : 54)}px` }}
                userBets={userBets}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
