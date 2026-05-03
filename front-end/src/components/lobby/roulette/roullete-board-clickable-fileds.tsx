import { memo } from 'react';
import { useRoulette } from '../../../providers/roulette/context';
import { useCredentials } from '../../../queries/auth';
import { useUserRouletteBets } from '../../../queries/roulette';
import { ClickableBoardField } from './clickable-board-components/clickable-board-field';
import { RouletteClickableRow } from './clickable-board-components/clickable-board-row';

export interface IClickableRowArray {
  values: (string | undefined)[];
}

export interface IClickableFiledsMap {
  [key: string]: IClickableRowArray[];
}

export const clickableFiledsMap: IClickableFiledsMap = {
  firstRow: [
    { values: [undefined, '0 - 3'] },
    { values: ['3', '3 - 6'] },
    { values: ['6', '6 - 9'] },
    { values: ['9', '9 - 12'] },
    { values: ['12', '12 - 15'] },
    { values: ['15', '15 - 18'] },
    { values: ['18', '18 - 21'] },
    { values: ['21', '21 - 24'] },
    { values: ['24', '24 - 27'] },
    { values: ['27', '27 - 30'] },
    { values: ['30', '30 - 33'] },
    { values: ['33', '33 - 36'] },
    { values: ['36'] },
    { values: ['2:1/1 - 3 - 6 - 9 - 12 - 15 - 18 - 21 - 24 - 27 - 30 - 33 - 36 '] },
  ],
  secondRow: [
    { values: [undefined, '0 - 2 - 3'] },
    { values: ['2 - 3', '2 - 3 - 5 - 6'] },
    { values: ['5 - 6', '5 - 6 - 8 - 9'] },
    { values: ['8 - 9', '8 - 9 - 11 - 12'] },
    { values: ['11 - 12', '11 - 12 - 14 - 15'] },
    { values: ['14 - 15', '14 - 15 - 17 - 18'] },
    { values: ['17 - 18', '17 - 18 - 20 - 21'] },
    { values: ['20 - 21', '20 - 21 - 23 - 24'] },
    { values: ['23 - 24', '23 - 24 - 26 - 27'] },
    { values: ['26 - 27', '26 - 27 - 29 - 30'] },
    { values: ['29 - 30', '29 - 30 - 32 - 33'] },
    { values: ['32 - 33', '32 - 33 - 35 - 36'] },
    { values: ['35 - 36'] },
  ],
  thirdRow: [
    { values: [undefined, '0 - 2'] },
    { values: ['2', '2 - 5'] },
    { values: ['5', '5 - 8'] },
    { values: ['8', '8 - 11'] },
    { values: ['11', '11 - 14'] },
    { values: ['14', '14 - 17'] },
    { values: ['17', '17 - 20'] },
    { values: ['20', '20 - 23'] },
    { values: ['23', '23 - 26'] },
    { values: ['26', '26 - 29'] },
    { values: ['29', '29 - 32'] },
    { values: ['32', '32 - 35'] },
    { values: ['35'] },
    { values: ['2:1/2 - 2 - 5 - 8 - 11 - 14 - 17 - 20 - 23 - 26 - 29 - 32 - 35 '] },
  ],
  forthRow: [
    { values: [undefined, '0 - 1 - 2'] },
    { values: ['1 - 2', '1 - 2 - 4 - 5'] },
    { values: ['4 - 5', '4 - 5 - 7 - 8'] },
    { values: ['7 - 8', '7 - 8 - 10 - 11'] },
    { values: ['10 - 11', '10 - 11 - 13 - 14'] },
    { values: ['13 - 14', '13 - 14 - 16 - 17'] },
    { values: ['16 - 17', '16 - 17 - 19 - 20'] },
    { values: ['19 - 20', '19 - 20 - 22 - 23'] },
    { values: ['22 - 23', '22 - 23 - 25 - 26'] },
    { values: ['25 - 26', '25 - 26 - 28 - 29'] },
    { values: ['28 - 29', '28 - 29 - 31 - 32'] },
    { values: ['31 - 32', '31 - 32 - 34 - 35'] },
    { values: ['34 - 35'] },
  ],
  fifthRow: [
    { values: [undefined, '0 - 1'] },
    { values: ['1', '1 - 4'] },
    { values: ['4', '4 - 7'] },
    { values: ['7', '7 - 10'] },
    { values: ['10', '10 - 13'] },
    { values: ['13', '13 - 16'] },
    { values: ['16', '16 - 19'] },
    { values: ['19', '19 - 22'] },
    { values: ['22', '22 - 25'] },
    { values: ['25', '25 - 28'] },
    { values: ['28', '28 - 31'] },
    { values: ['31', '31 - 34'] },
    { values: ['34'] },
    { values: ['2:1/3 - 1 - 4 - 7 - 10 - 13 - 16 - 19 - 22 - 25 - 28 - 31 - 34'] },
  ],
  sixthRow: [
    { values: [undefined, '0 - 1 - 2 - 3'] },
    { values: ['1 - 2 - 3', '1 - 2 - 3 - 4 - 5 - 6'] },
    { values: ['4 - 5 - 6', '4 - 5 - 6 - 7 - 8 - 9'] },
    { values: ['7 - 8 - 9', '7 - 8 - 9 - 10 - 11 - 12'] },
    { values: ['10 - 11 - 12', '10 - 11 - 12 - 13 - 14 - 15'] },
    { values: ['13 - 14 - 15', '13 - 14 - 15 - 16 - 17 - 18'] },
    { values: ['16 - 17 - 18', '16 - 17 - 18 - 19 - 20 - 21'] },
    { values: ['19 - 20 - 21', '19 - 20 - 21 - 22 - 23 - 24'] },
    { values: ['22 - 23 - 24', '22 - 23 - 24 - 25 - 26 - 27'] },
    { values: ['25 - 26 - 27', '25 - 26 - 27 - 28 - 29 - 30'] },
    { values: ['28 - 29 - 30', '28 - 29 - 30 - 31 - 32 - 33'] },
    { values: ['31 - 32 - 33', '31 - 32 - 33 - 34 - 35 - 36'] },
    { values: ['34 - 35 - 36'] },
  ],
  dozensRow: [
    { values: ['1_to_12 - 1 - 2 - 3 - 4 - 5 - 6 - 7 - 8 - 9 - 10 - 11 - 12'] },
    { values: ['13_to_24 - 13 - 14 - 15 - 16 - 17 - 18 - 19 - 20 - 21 - 22 - 23 - 24'] },
    { values: ['25_to_36 - 25 - 26 - 27 - 28 - 29 - 30 - 31 - 32 - 33 - 34 - 35 - 36'] },
  ],

  outsidesRow: [
    { values: ['1_to_18 - 1 - 2 - 3 - 4 - 5 - 6 - 7 - 8 - 9 - 10 - 11 - 12 - 13 - 14 - 15 - 16 - 17 - 18'] },
    { values: ['Even - 2 - 4 - 6 - 8 - 10 - 12 - 14 - 16 - 18 - 20 - 22 - 24 - 26 - 28 - 30 - 32 - 34 - 36'] },
    { values: ['Red - 1 - 3 - 5 - 7 - 9 - 12 - 14 - 16 - 18 - 19 - 21 - 23 - 25 - 27 - 30 - 32 - 34 - 36'] },
    { values: ['Black - 2 - 4 - 6 - 8 - 10 - 11 - 13 - 15 - 17 - 20 - 22 - 24 - 26 - 28 - 29 - 31 - 33 - 35'] },
    { values: ['Odd - 1 - 3 - 5 - 7 - 9 - 11 - 13 - 15 - 17 - 19 - 21 - 23 - 25 - 27 - 29 - 31 - 33 - 35'] },
    { values: ['19_to_36 - 19 - 20 - 21 - 22 - 23 - 24 - 25 - 26 - 27 - 28 - 29 - 30 - 31 - 32 - 33 - 34 - 35 - 36'] },
  ],
};

interface ClickableGridProps {
  onHoverField?: (field: string) => void;
  onLeaveField?: () => void;
}

const ClickableOverlay = memo(({ onHoverField, onLeaveField }: ClickableGridProps) => {
  const { selectedChipAmount, currentLobbyId } = useRoulette();
  const { data: credentials } = useCredentials();
  const { data: userBets } = useUserRouletteBets(credentials?.user, currentLobbyId);

  return (
    <div className="absolute top-0 flex h-full w-full flex-col">
      <div className="relative flex">
        <div className="absolute top-0 left-0 z-20 h-full min-w-[54px] border-0 border-red-500">
          <ClickableBoardField
            values={'0'}
            key={`clickable-field-0`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            userBets={userBets}
            selectedChipAmount={selectedChipAmount}
            className="absolute h-full w-[54px] cursor-pointer border-0 border-pink-400"
          />
        </div>
        <div className="">
          <RouletteClickableRow
            fields={clickableFiledsMap.firstRow}
            className="min-h-[46px]"
            key={`roulette-clickable-row-firstRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteClickableRow
            fields={clickableFiledsMap.secondRow}
            className="min-h-[16px]"
            key={`roulette-clickable-row-secondRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteClickableRow
            fields={clickableFiledsMap.thirdRow}
            className="min-h-[38px]"
            key={`roulette-clickable-row-thirdRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteClickableRow
            fields={clickableFiledsMap.forthRow}
            className="min-h-[16px]"
            key={`roulette-clickable-row-forthRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteClickableRow
            fields={clickableFiledsMap.fifthRow}
            className="min-h-[38px]"
            key={`roulette-clickable-row-fifthRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteClickableRow
            fields={clickableFiledsMap.sixthRow}
            className="min-h-[16px]"
            key={`roulette-clickable-row-sixthRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
        </div>
      </div>
      <div className="relative min-h-[48px] w-full border-0 border-blue-400">
        {clickableFiledsMap.dozensRow.map((position, idx) =>
          typeof position.values?.[0] === 'string' && position.values[0] ? (
            <ClickableBoardField
              values={position.values[0]}
              key={`clickable-field-${position.values[0]}`}
              onMouseEnter={onHoverField}
              onMouseLeave={onLeaveField}
              selectedChipAmount={selectedChipAmount}
              className="absolute h-full w-[252px] cursor-pointer border-0 border-pink-400"
              style={{ left: `${idx * 258 + 65}px` }}
              userBets={userBets}
            />
          ) : null,
        )}
      </div>
      <div className="relative min-h-[54px] w-full overflow-hidden border-0 border-blue-400">
        {clickableFiledsMap.outsidesRow.map((position, idx) =>
          typeof position.values?.[0] === 'string' && position.values[0] ? (
            <ClickableBoardField
              values={position.values[0]}
              key={`clickable-field-${position.values[0]}`}
              onMouseEnter={onHoverField}
              onMouseLeave={onLeaveField}
              selectedChipAmount={selectedChipAmount}
              className="absolute h-full w-[124px] cursor-pointer border-0 border-pink-400"
              style={{ left: `${idx * 129 + 65}px` }}
              userBets={userBets}
            />
          ) : null,
        )}
      </div>
    </div>
  );
});

export default ClickableOverlay;
