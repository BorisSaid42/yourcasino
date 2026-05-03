import { use } from 'react';
import { ModalContext } from '../../../providers/modal/context';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import { useAppForm } from '../../form/provider';
import { useChangeForgettenPassword } from '../../../queries/auth';
import { z } from 'zod';
import { classNames } from '../../../lib/utils';
import { notify } from '../../toast';

const changePasswordSchema = z
  .object({
    userId: z.string().uuid({ message: 'Invalid user ID' }),
    code: z.string().min(1, 'Reset code is required'),
    password: z
      .string()
      .min(8, 'Password is too short. Use at least 8 characters')
      .regex(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        'Password must contain at least 1 upper case letter, 1 lower case letter, 1 number or special character.',
      ),
    passwordRepeat: z.string(),
  })
  .refine((data) => data.password === data.passwordRepeat, {
    path: ['passwordRepeat'],
    message: 'Passwords do not match',
  });

export const ResetPasswordModal = () => {
  const { closeModal } = use(ModalContext);
  const resetPassword = useChangeForgettenPassword();
  const userId = localStorage.getItem('userId');
  const code = localStorage.getItem('code');

  const form = useAppForm({
    onSubmit: async ({ value }) => {
      if (!code || !userId) {
        return;
      }

      const data = await resetPassword.mutateAsync(
        {
          code: code,
          password: value.password,
          userId: userId,
        },
        {
          onError: () => {
            console.log('error on change');
          },
        },
      );

      if (data) {
        notify('success', { content: 'You can login now with your new password', title: 'Password Changed' });
        closeModal();
      }
    },
    validators: {
      onSubmit: changePasswordSchema,
    },
    defaultValues: {
      code: code,
      userId: userId,
      passwordRepeat: '',
      password: '',
    },
  });

  return (
    <div className="flex min-h-[260px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-between border-b border-b-[#12223B] px-9 py-[21px]">
        <div className="flex gap-6 text-base font-extrabold">
          <span className={`'text-white`}>Reset Password</span>
        </div>
        <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      <div className="px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();

            form.handleSubmit();
          }}
          className="flex w-full flex-col items-center gap-5"
        >
          <div className="flex w-full flex-col items-center gap-5 border-b border-[#12223B] px-9 py-6 max-sm:border-0 max-sm:pb-3">
            <form.AppField
              name="password"
              children={(field) => (
                <field.TextField
                  className=""
                  labelProps={{
                    children: <div className="flex items-center text-[#6E88AF8F]">New password</div>,
                  }}
                  inputProps={{
                    type: 'password',
                    className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF]',
                    onFocus: (e) => e.target.select(),
                  }}
                />
              )}
            ></form.AppField>

            <form.AppField
              name="passwordRepeat"
              children={(field) => (
                <field.TextField
                  className=""
                  labelProps={{
                    children: <div className="flex items-center text-[#6E88AF8F]">Repeat Password</div>,
                  }}
                  inputProps={{
                    className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF]',
                    onFocus: (e) => e.target.select(),
                    type: 'password',
                  }}
                />
              )}
            ></form.AppField>
            <form.AppForm>
              <form.SubmitButton
                type="submit"
                className={classNames(
                  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-[#60A4FD] px-4 py-4 text-base font-bold hover:opacity-80',
                )}
              >
                Change password
              </form.SubmitButton>
            </form.AppForm>
          </div>
        </form>
      </div>
    </div>
  );
};
