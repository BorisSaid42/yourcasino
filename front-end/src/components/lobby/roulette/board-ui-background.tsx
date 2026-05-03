import { use, useCallback } from 'react';
import { ModalContext } from '../../../providers/modal/context';
import { useRoulette } from '../../../providers/roulette/context';
import { useCredentials } from '../../../queries/auth';
import { RouletteGameStatus, useCurrentGame } from '../../../queries/roulette';
import { BoardUIField } from './board-ui-field';
import { AuthModalOpened } from '../../modals/auth/auth-modal.enum';

export interface IRouletteField {
  id: string; // unique
  label: string | number; // visible label, like "1", "Even"
  type: 'number' | 'split' | 'dozen' | 'outside';
  value: number | number[]; // used for betting logic
  backgroundType: 'red' | 'black' | 'green' | 'gray';
  gridPosition: {
    rowStart: number;
    colStart: number;
    rowSpan?: number;
    colSpan?: number;
  };
}
export function generateRouletteFields(): IRouletteField[] {
  const fields: IRouletteField[] = [];

  // 0 field
  fields.push({
    id: '0',
    label: '0',
    type: 'number',
    value: 0,
    backgroundType: 'green',
    gridPosition: {
      rowStart: 1,
      colStart: 1,
      rowSpan: 3,
    },
  });

  // Numbers 1–36
  const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

  for (let i = 1; i <= 36; i++) {
    const col = Math.ceil(i / 3) + 1; // skip first col (0)
    const rowOffset = (i - 1) % 3;

    fields.push({
      id: i.toString(),
      label: i.toString(),
      type: 'number',
      value: i,
      backgroundType: i === 0 ? 'green' : redNumbers.has(i) ? 'red' : 'black',
      gridPosition: {
        rowStart: 3 - rowOffset,
        colStart: col,
      },
    });
  }

  // Number rows
  const numberRows = ['2:1', '2:1', '2:1'];
  for (let i = 0; i < numberRows.length; i++) {
    fields.push({
      id: `2:1/${i + 1}`,
      label: numberRows[i],
      type: 'outside',
      backgroundType: 'gray',
      gridPosition: {
        rowStart: i + 1,
        colStart: 14,
      },
      value: [],
    });
  }

  // Dozens
  const dozens = ['1 to 12', '13 to 24', '25 to 36'];
  for (let i = 0; i < 3; i++) {
    fields.push({
      id: dozens[i].replace(/ /g, '_'),
      label: dozens[i],
      type: 'dozen',
      value: [i * 12 + 1, i * 12 + 12],
      backgroundType: 'gray',
      gridPosition: {
        rowStart: 4,
        colStart: i * 4 + 2,
        colSpan: 4,
      },
    });
  }

  // Outside bets
  const outsideBets = [
    { id: '1_to_18', label: '1 to 18' },
    { id: 'even', label: 'Even' },
    { id: 'red', label: 'Red', backgroundType: 'red' },
    { id: 'black', label: 'Black', backgroundType: 'black' },
    { id: 'odd', label: 'Odd' },
    { id: '19_to_36', label: '19 to 36' },
  ];
  for (let i = 0; i < outsideBets.length; i++) {
    fields.push({
      id: outsideBets[i].id,
      label: outsideBets[i].label,
      type: 'outside',
      value: [],
      backgroundType:
        outsideBets[i]?.backgroundType === 'red'
          ? 'red'
          : outsideBets[i]?.backgroundType === 'black'
            ? 'black'
            : 'gray',
      gridPosition: {
        rowStart: 5,
        colStart: i * 2 + 2,
        colSpan: 2,
      },
    });
  }

  return fields;
}

export const BoardUIBackground = ({ highlightedValues }: { highlightedValues: string[] }) => {
  const fields = generateRouletteFields();
  const { rouletteGameStatus, currentLobbyId } = useRoulette();
  const { data: currentGame } = useCurrentGame(currentLobbyId);
  const { data: credentials } = useCredentials();
  const { openModal } = use(ModalContext);

  const handleOpenLoginModal = useCallback(() => {
    openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
  }, [openModal]);

  return (
    <div className="relative grid w-full max-w-[900px] grid-cols-[repeat(14,_1fr)] grid-rows-[repeat(5,_50px)] gap-1.5">
      {!credentials?.user && (
        <div className="absolute z-10 flex w-full translate-y-1/2 flex-col items-center justify-center gap-6 text-xl font-extrabold">
          <span>Please sign in to be able to play</span>
          <div className="btn-nav btn-primary" onClick={handleOpenLoginModal}>
            Sign In
          </div>
        </div>
      )}
      {currentGame?.lobby?.ownerId === credentials?.user && (
        <div className="absolute top-[50px] z-10 flex w-full translate-y-1/2 flex-col items-center justify-center gap-6 text-xl font-extrabold">
          <span>You can't bet on your own table</span>
        </div>
      )}
      {fields.map((field) => (
        <BoardUIField
          field={field}
          isHighlighted={highlightedValues.includes(field.id) || rouletteGameStatus === RouletteGameStatus.PLAYING}
          key={field.id}
        />
      ))}
    </div>
  );
};
