import { use, useState } from 'react';
import { z } from 'zod';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import { classNames } from '../../../lib/utils';
import { ModalContext } from '../../../providers/modal/context';
import { useForgetPassword } from '../../../queries/auth';
import { useAppForm } from '../../form/provider';
import { notify } from '../../toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').min(3, 'Email is too short').max(100, 'Email is too long'),
});

export const ForgotPasswordModal = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { closeModal } = use(ModalContext);
  const changePassword = useForgetPassword();

  const form = useAppForm({
    onSubmit: async ({ value }) => {
      setIsProcessing(true);
      await changePassword.mutateAsync(
        {
          email: value.email,
        },
        {
          onError: () => {
            setIsProcessing(false);
          },
          onSuccess: () => {
            notify('success', { title: 'Email sent', content: 'Please check your inbox' });
            closeModal();
          },
        },
      );
    },
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    defaultValues: {
      email: '',
    },
  });

  return (
    <div className="flex min-h-[260px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-between border-b border-b-[#12223B] px-9 py-[21px]">
        <div className="flex gap-6 text-base font-extrabold">
          <span className={`'text-white`}>Forgot Password</span>
        </div>
        <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      <div className="px-5">
        <div className="w-full pt-6 text-lg">
          <div className="text-center">Please enter you email address</div>
        </div>
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
              name="email"
              children={(field) => (
                <field.TextField
                  className=""
                  labelProps={{
                    children: <div className="flex items-center text-[#6E88AF8F]">Email</div>,
                  }}
                  inputProps={{
                    type: 'email',
                    autoComplete: 'email',
                    className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF]',
                    onFocus: (e) => e.target.select(),
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
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing' : 'Send email'}
              </form.SubmitButton>
            </form.AppForm>
          </div>
        </form>
      </div>
    </div>
  );
};
