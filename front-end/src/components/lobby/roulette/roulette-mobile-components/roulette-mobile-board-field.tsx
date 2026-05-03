import { classNames } from '../../../../lib/utils';
import { useRoulette } from '../../../../providers/roulette/context';
import { useCredentials } from '../../../../queries/auth';
import { useCurrentGame } from '../../../../queries/roulette';
import { IRouletteField } from '../board-ui-background';

export const MobileRouleteBoardUIField = ({
  field,
  isHighlighted,
}: {
  field: IRouletteField;
  isHighlighted: boolean;
}) => {
  const { data: credentials } = useCredentials();
  const { currentLobbyId } = useRoulette();
  const { data: currentGame } = useCurrentGame(currentLobbyId);
  return (
    <div
      className={classNames(
        `flex items-center justify-center rounded-sm border-2 text-sm font-semibold text-white duration-300 select-none`,
        field.backgroundType === 'red'
          ? 'border-transparent bg-[#FF3C48]'
          : field.backgroundType === 'black'
            ? 'border-transparent bg-[#364E71]'
            : field.backgroundType === 'green'
              ? 'border-transparent bg-[#328C3C]'
              : 'border-[#35445C] bg-transparent',
        isHighlighted ? 'opacity-50' : '',
        !credentials?.user ? 'opacity-20 blur-[1px]' : '',
        currentGame?.lobby?.ownerId === credentials?.user ? 'opacity-20 blur-[1px]' : '',
        isNaN(+field.label) && field.label !== '2:1' ? '[text-orientation:mixed] [writing-mode:vertical-rl]' : '',
      )}
      style={{
        gridColumn: `${field.value === 0 ? field.gridPosition.rowStart + 2 : 5 - field.gridPosition.rowStart + 1} / span ${field.gridPosition.rowSpan ?? 1}`,
        gridRow: `${field.gridPosition.colStart} / span ${field.gridPosition.colSpan ?? 1}`,
      }}
    >
      {field.label}
    </div>
  );
};
