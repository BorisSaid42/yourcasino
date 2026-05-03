import { use, useCallback } from 'react';
import { ModalContext } from '../../../../providers/modal/context';
import { useRoulette } from '../../../../providers/roulette/context';
import { useCredentials } from '../../../../queries/auth';
import { RouletteGameStatus, useCurrentGame } from '../../../../queries/roulette';
import { generateRouletteFields } from '../board-ui-background';
import { MobileRouleteBoardUIField } from './roulette-mobile-board-field';
import { AuthModalOpened } from '../../../modals/auth/auth-modal.enum';

export const RouletteMobileBoardUI = () => {
  const fields = generateRouletteFields();
  const { rouletteGameStatus, currentLobbyId } = useRoulette();
  const { data: credentials } = useCredentials();
  const { data: currentGame } = useCurrentGame(currentLobbyId);
  const { openModal } = use(ModalContext);

  const handleOpenLoginModal = useCallback(() => {
    openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
  }, [openModal]);

  return (
    <div className="mx-auto grid w-full grid-cols-[repeat(5,_38px)] grid-rows-[repeat(14,_28px)] gap-1">
      {!credentials?.user && (
        <div className="absolute top-[100px] z-10 flex w-full translate-y-1/2 flex-col items-center justify-center gap-6 text-center text-xl font-extrabold">
          <span>Please sign in to be able to play</span>
          <div className="btn-nav btn-primary" onClick={handleOpenLoginModal}>
            Sign In
          </div>
        </div>
      )}
      {currentGame?.lobby?.ownerId === credentials?.user && (
        <div className="absolute top-[150px] z-10 flex w-full translate-y-1/2 flex-col items-center justify-center gap-6 text-center text-xl font-extrabold">
          <span>You can't bet on your own table</span>
        </div>
      )}
      {fields.map((field) => (
        <MobileRouleteBoardUIField
          field={field}
          isHighlighted={
            rouletteGameStatus === RouletteGameStatus.PLAYING || rouletteGameStatus === RouletteGameStatus.FINISHED
          }
          key={field.id}
        />
      ))}
    </div>
  );
};
