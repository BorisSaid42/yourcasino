import { useCallback } from 'react';
import { ClickableBoardField } from '../clickable-board-components/clickable-board-field';
import { clickableFiledsMap } from '../roullete-board-clickable-fileds';
import { useRoulette } from '../../../../providers/roulette/context';
import { RouletteMobileClickableRow } from './roulette-mobile-clickable-row';
import { useCredentials } from '../../../../queries/auth';
import { useUserRouletteBets } from '../../../../queries/roulette';

export const RouletteMobileClickableGrid = () => {
  const { selectedChipAmount, currentLobbyId } = useRoulette();
  const { data: credentials } = useCredentials();
  const { data: userBets } = useUserRouletteBets(credentials?.user, currentLobbyId);
  const onHoverField = useCallback(() => {}, []);

  const onLeaveField = useCallback(() => {}, []);

  return (
    <div className="absolute top-0 flex h-full w-full origin-center rotate-z-0 flex-col border-0">
      <div className="relative flex flex-col">
        <ClickableBoardField
          values={'0'}
          key={`clickable-field-0`}
          onMouseEnter={onHoverField}
          onMouseLeave={onLeaveField}
          selectedChipAmount={selectedChipAmount}
          className="absolute right-0 h-7 w-[121px] cursor-pointer border-0 border-pink-400"
          userBets={userBets}
        />
        <div className="relative flex flex-row-reverse justify-start">
          <RouletteMobileClickableRow
            fields={clickableFiledsMap.firstRow}
            className="max-w-[32px]"
            key={`roulette-clickable-row-firstRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteMobileClickableRow
            fields={clickableFiledsMap.secondRow}
            className="max-w-[16px]"
            key={`roulette-clickable-row-secondRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteMobileClickableRow
            fields={clickableFiledsMap.thirdRow}
            className="max-w-[26px]"
            key={`roulette-clickable-row-thirdRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteMobileClickableRow
            fields={clickableFiledsMap.forthRow}
            className="max-w-[16px]"
            key={`roulette-clickable-row-forthRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteMobileClickableRow
            fields={clickableFiledsMap.fifthRow}
            className="max-w-[26px]"
            key={`roulette-clickable-row-fifthRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
          <RouletteMobileClickableRow
            fields={clickableFiledsMap.sixthRow}
            className="max-w-[16px]"
            key={`roulette-clickable-row-sixthRow`}
            onMouseEnter={onHoverField}
            onMouseLeave={onLeaveField}
            selectedChipAmount={selectedChipAmount}
            userBets={userBets}
          />
        </div>
      </div>
      <div className="relative h-full max-w-[24px] border-0 border-blue-400">
        {clickableFiledsMap.dozensRow.map((position, idx) =>
          typeof position.values?.[0] === 'string' && position.values[0] ? (
            <ClickableBoardField
              values={position.values[0]}
              key={`clickable-field-${position.values[0]}`}
              onMouseEnter={onHoverField}
              onMouseLeave={onLeaveField}
              selectedChipAmount={selectedChipAmount}
              className="absolute h-[124px] w-full cursor-pointer border-0 border-pink-400"
              style={{ top: `${idx * 128 + 26}px`, left: '46px' }}
              userBets={userBets}
            />
          ) : null,
        )}
      </div>
      <div className="h-full max-w-[36px] border-0 border-blue-400">
        {clickableFiledsMap.outsidesRow.map((position, idx) =>
          typeof position.values?.[0] === 'string' && position.values[0] ? (
            <ClickableBoardField
              values={position.values[0]}
              key={`clickable-field-${position.values[0]}`}
              onMouseEnter={onHoverField}
              onMouseLeave={onLeaveField}
              selectedChipAmount={selectedChipAmount}
              className="absolute h-[60px] w-full max-w-[36px] cursor-pointer border-0 border-pink-400"
              style={{ top: `${idx * 62 + 34}px` }}
              userBets={userBets}
            />
          ) : null,
        )}
      </div>
    </div>
  );
};
