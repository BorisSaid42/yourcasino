import { classNames } from '../../../lib/utils';
import { useRoulette } from '../../../providers/roulette/context';
import { useCredentials } from '../../../queries/auth';
import { useCurrentGame } from '../../../queries/roulette';
import { IRouletteField } from './board-ui-background';

export const BoardUIField = ({ field, isHighlighted }: { field: IRouletteField; isHighlighted: boolean }) => {
  const { currentLobbyId } = useRoulette();
  const { data: currentGame } = useCurrentGame(currentLobbyId);
  const { data: credentials } = useCredentials();
  return (
    <div
      className={classNames(
        `flex items-center justify-center rounded-[6px] border-4 text-lg font-semibold text-white duration-300 select-none`,
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
      )}
      style={{
        gridColumn: `${field.gridPosition.colStart} / span ${field.gridPosition.colSpan ?? 1}`,
        gridRow: `${field.gridPosition.rowStart} / span ${field.gridPosition.rowSpan ?? 1}`,
      }}
    >
      {field.label}
    </div>
  );
};
