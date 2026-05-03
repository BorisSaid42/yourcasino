import { use, useCallback } from 'react';
import { ModalContext } from '../../../providers/modal/context';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import { z } from 'zod';
import { useChangeUsername, useCredentials } from '../../../queries/auth';
import backIcon from '../../../assets/icons/common/go-back.svg';
import { useAppForm } from '../../form/provider';
import { useProfileStats } from '../../../queries/profile';
import { notify } from '../../toast';

const changeUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username is too short. Use at least 3 characters.')
    .max(15, 'Username is too long. Keep it under 16 characters.')
    .regex(
      /^(?!.*[-_]{3})[a-zA-Z0-9][a-zA-Z0-9-_]*$/,
      'Username must start with a letter or number and use only letters, numbers, and at most two symbols (- or _) at a time.',
    ),
});

export const ChangeUsernameModal = () => {
  const { data: credentials } = useCredentials();
  const { data: profileStats } = useProfileStats(credentials?.user);
  const { closeModal } = use(ModalContext);
  const { replaceModal } = use(ModalContext);
  const updateUsername = useChangeUsername();

  const form = useAppForm({
    onSubmit: async ({ value, formApi }) => {
      const data = await updateUsername.mutateAsync({
        newUsername: value.username,
      });

      if (data) {
        notify('success', { title: 'Username changed', content: 'Your username has been successfuly updated' });
        closeModal();
        formApi.reset();
      }
    },
    validators: {
      onSubmit: changeUsernameSchema,
    },
    defaultValues: {
      username: profileStats?.username || '',
    },
  });

  const handleOpenStatsModal = useCallback(() => {
    replaceModal((prevOptions) => ({
      key: 'profile-stats',
      props: prevOptions.props,
      closable: true,
    }));
  }, [replaceModal]);

  return (
    <div className="flex min-h-[300px] min-w-[500px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="relative flex w-full items-center justify-between border-b border-[#12223B] px-9 py-5 max-md:px-3.5 max-md:py-4">
        <div className="flex gap-3 font-bold">Change Username</div>
        <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>

      <div>
        <div className="mt-5 text-center font-semibold text-[#465B7C]">Please enter your new username</div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();

            form.handleSubmit();
          }}
        >
          <div className="flex flex-col items-center gap-5 border-[#12223B] px-9 py-4">
            <form.AppField
              name="username"
              children={(field) => (
                <field.TextField
                  className=""
                  labelProps={{
                    children: <div className="flex items-center text-[#6E88AF8F]">Username</div>,
                  }}
                  inputProps={{
                    className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF]',
                    onFocus: (e) => e.target.select(),
                  }}
                />
              )}
            ></form.AppField>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 px-9">
            <div className="mt-3 flex w-full justify-center">
              <form.AppForm>
                <form.SubmitButtonAlt skin="primary" className="w-full max-sm:py-3! max-sm:text-xs!">
                  Submit
                </form.SubmitButtonAlt>
              </form.AppForm>
            </div>
            <div
              onClick={handleOpenStatsModal}
              className="m-3 flex w-[140px] cursor-pointer justify-center gap-3 rounded-[5px] bg-[#3B557D55] p-1.5 hover:bg-[#3B557D] hover:opacity-85"
            >
              <img className="w-[15px]" src={backIcon} />
              <span>Go Back</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
