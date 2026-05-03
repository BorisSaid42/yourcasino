import { useCallback, useEffect, useState } from 'react';
import { BoardUIBackground } from './board-ui-background';
import ClickableGrid from './roullete-board-clickable-fileds';
import { useRoulette } from '../../../providers/roulette/context';
import { RouletteGameStatus, useCurrentGame } from '../../../queries/roulette';
import { useCredentials } from '../../../queries/auth';

export const RouletteBoard = () => {
  const [highlightedValues, setHighlightedValues] = useState<string[]>([]);
  const { rouletteGameStatus, currentLobbyId } = useRoulette();
  const { data: currentGame } = useCurrentGame(currentLobbyId);
  const { data: credentials } = useCredentials();

  const extractHighlightValues = useCallback((field: string): string[] => {
    return field.includes('-')
      ? field
          .toLowerCase()
          .split('-')
          .map((v) => v.trim())
      : [field.trim().toLowerCase()];
  }, []);

  const handleHoverField = useCallback(
    (field: string) => {
      setHighlightedValues(extractHighlightValues(field));
    },
    [extractHighlightValues],
  );

  const handleLeaveField = useCallback(() => {
    setHighlightedValues([]);
  }, []);

  useEffect(() => {
    if (rouletteGameStatus === RouletteGameStatus.WAITING_BETS) {
      setHighlightedValues([]);
    }
  }, [rouletteGameStatus]);

  return (
    <div className="flex h-full min-h-[340px] w-full items-center justify-center rounded-b-lg bg-[linear-gradient(180deg,_rgba(25,_52,_94,_0.24)_0%,_rgba(23,_48,_83,_0.24)_100%)]">
      <div className="relative w-full max-w-[900px]">
        {/* Roulette UI background for board*/}
        <BoardUIBackground highlightedValues={highlightedValues} />
        {/* All the clickable fields layer*/}
        {credentials?.user && currentGame?.lobby?.ownerId !== credentials?.user && (
          <ClickableGrid onHoverField={handleHoverField} onLeaveField={handleLeaveField} />
        )}
      </div>
    </div>
  );
};
