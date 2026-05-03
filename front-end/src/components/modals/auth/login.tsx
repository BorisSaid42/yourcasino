import { GoogleOAuthProvider } from '@react-oauth/google';
import { useCallback, useContext } from 'react';
import { z } from 'zod';
import { ModalContext } from '../../../providers/modal/context';
import { LoginPayload, useLogin } from '../../../queries/auth';
import { useAppForm } from '../../form/provider';
import { GoogleLoginButton } from './google-login-button';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3).max(32),
  password: z.string(),
});
export const LoginModalContent = () => {
  const login = useLogin();
  const { closeModal, replaceModal } = useContext(ModalContext);
  // const [loading, setLoading] = useState(false);
  const form = useAppForm({
    onSubmit: async ({ value, formApi }) => {
      // setLoading(true);
      try {
        await login.mutateAsync({
          usernameOrEmail: value.usernameOrEmail,
          password: value.password,
        });

        closeModal(true);
        formApi.reset();
        window.location.reload();
      } finally {
        // setLoading(false);
      }
    },

    validators: {
      onSubmit: loginSchema,
    },
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    } as LoginPayload,
  });

  const handleOpenForgotPasswordModal = useCallback(() => {
    replaceModal((prevOptions) => ({
      key: 'forgot-password-modal',
      props: prevOptions.props,
      closable: prevOptions.closable,
    }));
  }, [replaceModal]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();

        form.handleSubmit();
      }}
    >
      <div className="flex flex-col items-center gap-5 border-b border-[#12223B] px-9 py-6 max-sm:border-0 max-sm:pb-3">
        <form.AppField
          name="usernameOrEmail"
          children={(field) => (
            <field.TextField
              className=""
              labelProps={{
                children: <div className="flex items-center text-[#6E88AF8F]">Email / Username</div>,
              }}
              inputProps={{
                autoComplete: 'email',
                className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF]',
                onFocus: (e) => e.target.select(),
              }}
            />
          )}
        ></form.AppField>
        <form.AppField
          name="password"
          children={(field) => (
            <field.TextField
              className=""
              labelProps={{
                children: <div className="flex items-center text-[#6E88AF8F]">Password</div>,
              }}
              inputProps={{
                autoComplete: 'current-password',
                className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF]',
                onFocus: (e) => e.target.select(),
                type: 'password',
              }}
            />
          )}
        ></form.AppField>
        <div
          onClick={handleOpenForgotPasswordModal}
          className="flex w-full cursor-pointer justify-center gap-[13px] font-extrabold text-[#60A4FD] underline max-sm:text-xs"
        >
          Forgot password
        </div>
        <div className="flex w-full justify-center">
          <form.AppForm>
            <form.SubmitButtonAlt
              text="Sign In"
              className="w-full font-bold max-sm:py-3! max-sm:text-xs!"
              skin="primary"
            ></form.SubmitButtonAlt>
          </form.AppForm>
        </div>
      </div>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <GoogleLoginButton closeModal={() => closeModal(true)} />
      </GoogleOAuthProvider>
    </form>
  );
};
