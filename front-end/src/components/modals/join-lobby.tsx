import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { use } from 'react';
import { z } from 'zod';
import crossIcon from '../../assets/icons/common/cross-icon.svg';
import { api } from '../../lib/interaction/api';
import { ModalContext } from '../../providers/modal/context';
import { LobbyType } from '../../queries/lobby';
import { useAppForm } from '../form/provider';
import { notify } from '../toast';

const joinLobbySchema = z.object({
  lobbyCode: z.string().min(5, 'Lobby code is too short').max(256, 'Lobby code is too long'),
});

function normalizeLobbyCode(input: string): string {
  if (input.includes('/lobby')) {
    const splittedByLobby = input.split('/lobby')[1];

    return splittedByLobby.split('/')[1];
  }

  return input.trim();
}

export const JoinLobbyModal = () => {
  const { closeModal } = use(ModalContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useAppForm({
    onSubmit: async ({ value, formApi }) => {
      const code = normalizeLobbyCode(value.lobbyCode);

      const gameRedirect = value.lobbyCode.includes('/roulette')
        ? 'roulette'
        : value.lobbyCode.includes('/blackjack')
          ? 'blackjack'
          : '';

      try {
        const lobby = await queryClient.fetchQuery({
          queryKey: ['lobby', 'details', code.toUpperCase()],
          queryFn: () => api.get<LobbyType, LobbyType>(`/lobby/${code}`),
        });

        if (lobby?.id) {
          closeModal(true);
          formApi.reset();
          navigate({ to: `/lobby/${code?.toUpperCase()}/${gameRedirect}` });
        } else {
          notify('error', { content: 'Lobby not found.', title: 'Error' });
        }
      } catch (error) {
        console.error(error);
        notify('error', { title: 'Error', content: 'Could not find a lobby with that code.' });
      }
    },
    validators: {
      onSubmit: joinLobbySchema,
    },
    defaultValues: {
      lobbyCode: '',
    },
  });

  return (
    <div className="min-w-[720px] rounded-[12px] bg-[#152947] max-md:w-[100vw] max-md:min-w-[unset] max-md:rounded-none">
      <div className="flex w-full items-center justify-between border-b border-[#12223B] px-9 pt-[29px] pb-6 text-2xl font-extrabold">
        <div>Join a Lobby</div>
        <button onClick={() => closeModal(true)} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      <form
        className="flex w-full flex-col items-center justify-center"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex w-full px-9 pt-[29px] pb-6">
          <form.AppField name="lobbyCode">
            {(field) => (
              <field.TextField
                labelProps={{
                  children: <span className="text-[#6E88AF8F]">Lobby Code or Invite Link</span>,
                }}
                inputProps={{
                  placeholder: 'Enter code or paste link',
                  className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF]',
                  onFocus: (e) => e.target.select(),
                }}
              />
            )}
          </form.AppField>
        </div>

        <div className="flex w-full justify-end px-[38px] py-6">
          <form.AppForm>
            <form.SubmitButtonAlt
              text="Join Lobby"
              skin="primary"
              className="w-fit gap-2 max-sm:w-full max-sm:justify-center"
            ></form.SubmitButtonAlt>
          </form.AppForm>
        </div>
      </form>
    </div>
  );
};
