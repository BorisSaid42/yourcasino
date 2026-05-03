import { use } from 'react';
import { SocketLockContext } from '../../providers/socket-locks/context';
import { FairnessGameType, useVerifyFairness } from '../../queries/fairness';
import { useAppForm } from '../form/provider';
import { z } from 'zod';
import { ModalContext } from '../../providers/modal/context';
import { classNames } from '../../lib/utils';

const fairnessSchema = z.object({
  game: z.nativeEnum(FairnessGameType, {
    required_error: 'Game is required',
    invalid_type_error: 'Game must be blackjack or roulette',
  }),
  serverSeed: z.coerce
    .string({ invalid_type_error: 'Server Seed is required' })
    .min(64, 'Server Seed must contain at least 64 character(s)'),
  fairnessRandom: z.coerce
    .string({ invalid_type_error: 'Fairness Random.org String is required' })
    .min(64, 'Random.org string must contain at least 64 character(s)'),
  numOfDecks: z.coerce
    .number({ invalid_type_error: 'Number of decks must be a number' })
    .int('Number of decks must be an integer')
    .min(1, 'Number of decks must be at least 1')
    .max(4, 'Number of decks must not be greater than 4'),
});

export const FairnessForm = () => {
  const fairnessVerify = useVerifyFairness();
  const { openModal } = use(ModalContext);
  const { isLocked, setLock } = use(SocketLockContext);

  const form = useAppForm({
    onSubmit: async ({ value }) => {
      setLock('fairness-verify', true);
      const fairnessData = await fairnessVerify.mutateAsync(
        {
          game: value.game,
          serverSeed: value.serverSeed,
          fairnessRandom: value.fairnessRandom,
          numOfDecks: value.game === FairnessGameType.BLACKJACK ? Number(value.numOfDecks) : undefined,
        },
        {
          onError: () => {
            setLock('fairness-verify', false);
          },
        },
      );

      setLock('fairness-verify', false);
      if (fairnessData) {
        openModal({ key: 'fairness-verification-data', props: { fairnessData }, closable: true, lightBlur: true });
      }
    },
    validators: {
      onSubmit: fairnessSchema,
    },
    defaultValues: {
      game: FairnessGameType.BLACKJACK,
      serverSeed: '',
      fairnessRandom: '',
      numOfDecks: 2,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();

        form.handleSubmit();
      }}
      className=""
    >
      <div className="mb-[19px] text-2xl font-extrabold text-[#4486DD]">Verify the game</div>
      <div className="flex flex-col gap-3">
        <form.AppField
          name="game"
          children={(field) => (
            <field.SelectField
              className="col-start-1 col-end-2 row-start-2 row-end-3"
              labelProps={{ children: 'Choose Game', className: 'text-[#6E88AF8F] hidden md:block text-xs lg:text-sm' }}
              options={[
                { value: 'blackjack', label: 'Blackjack' },
                { value: 'roulette', label: 'Roulette' },
              ]}
            />
          )}
          validators={{
            onChange: ({ value }) => (!value ? { message: 'Please select a game' } : undefined),
          }}
        />
        <form.AppField
          name="serverSeed"
          children={(field) => (
            <field.TextField
              labelProps={{
                children: <span className="mb-1 flex items-center text-[#6E88AF8F]">Server Seed</span>,
              }}
              inputProps={{
                className: 'bg-[#08152A] border border-[#253C60] rounded-[5px]',
              }}
            />
          )}
        />
        <form.AppField
          name="fairnessRandom"
          children={(field) => (
            <field.TextField
              labelProps={{
                children: <span className="mb-1 flex items-center text-[#6E88AF8F]">Random.org String</span>,
              }}
              inputProps={{
                className: 'bg-[#08152A] border border-[#253C60] rounded-[5px]',
              }}
            />
          )}
        />
        <form.Subscribe
          selector={(state) => state.values.game}
          children={(game) =>
            game === FairnessGameType.BLACKJACK ? (
              <form.AppField
                name="numOfDecks"
                children={(field) => (
                  <field.TextField
                    labelProps={{
                      children: <span className="mb-1 flex items-center text-[#6E88AF8F]">Number of Decks</span>,
                    }}
                    inputProps={{
                      className: 'bg-[#08152A] border border-[#253C60] rounded-[5px]',
                      type: 'number',
                      min: 1,
                      onChange: (e) => {
                        field.handleChange(Number(e.target.value));
                      },
                    }}
                  />
                )}
              />
            ) : null
          }
        />
      </div>
      <form.AppForm>
        <div className="mt-4">
          <form.SubmitButton
            className={classNames(
              'cursor-pointer rounded-[5px] bg-[#4486DD]',
              isLocked('fairness-verify') ? 'cursor-default opacity-0.5' : '',
            )}
          >
            Verify
          </form.SubmitButton>
        </div>
      </form.AppForm>
    </form>
  );
};
