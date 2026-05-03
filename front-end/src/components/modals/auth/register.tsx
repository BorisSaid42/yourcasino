import { useContext } from 'react';
import { z } from 'zod';
import { ModalContext } from '../../../providers/modal/context';
import { RegisterPayload, useRegister } from '../../../queries/auth';
import { useAppForm } from '../../form/provider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleLoginButton } from './google-login-button';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(15, 'Username is too long. Keep it under 16 characters.')
      .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|[-_]{1,2})*$/, 'Only letters, numbers and - or _ are allowed.'),
    email: z.string().min(3, 'Email is too short').email('Invalid email address').max(100, 'Email is too long'),
    password: z
      .string()
      .min(8, 'Must have at least 8 characters')
      .regex(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        'Must contain 1 upper case letter, 1 lower case letter, 1 number or special character.',
      ),
    passwordRepeat: z.string(),
    tos: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Privacy Policy' }),
    }),
  })
  .refine((data) => data.password === data.passwordRepeat, {
    path: ['passwordRepeat'],
    message: 'Passwords do not match',
  });

export const RegisterModalContent = () => {
  const register = useRegister();
  const { closeModal } = useContext(ModalContext);
  const form = useAppForm({
    onSubmit: async ({ value, formApi }) => {
      await register.mutateAsync({
        username: value.username,
        email: value.email,
        password: value.password,
        tos: value.tos,
      });

      closeModal(true);
      formApi.reset();
    },
    validators: {
      onSubmit: registerSchema,
    },
    defaultValues: {
      email: '',
      username: '',
      password: '',
      passwordRepeat: '',
      tos: false,
    } as RegisterPayload,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();

        form.handleSubmit();
      }}
    >
      <div className="flex flex-col items-center gap-5 border-[#12223B] px-9 pt-6">
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
        <form.AppField
          name="email"
          children={(field) => (
            <field.TextField
              className=""
              labelProps={{
                children: <div className="flex items-center text-[#6E88AF8F]">Email</div>,
              }}
              inputProps={{
                className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF]',
                onFocus: (e) => e.target.select(),
              }}
            />
          )}
        ></form.AppField>
        <div className="flex gap-3">
          <form.AppField
            name="password"
            children={(field) => (
              <field.TextField
                className=""
                labelProps={{
                  children: <div className="flex items-center text-[#6E88AF8F]">Password</div>,
                }}
                inputProps={{
                  className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF]',
                  onFocus: (e) => e.target.select(),
                  type: 'password',
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
        </div>
        <form.AppField
          name="tos"
          children={(field) => (
            <field.CheckboxField
              className="w-full"
              checkboxProps={{
                className: 'tos-checkbox',
              }}
              labelProps={{
                className: 'tos-text max-sm:text-xs!',
                children: (
                  <>
                    I attest that I am at least 18 years old and have read and agree with the Terms of Service and
                    Privacy Policy.
                  </>
                ),
              }}
            />
          )}
        ></form.AppField>
        <div className="flex w-full flex-col items-center">
          <form.AppForm>
            <form.SubmitButtonAlt
              text="Register"
              skin="register"
              className="w-full max-sm:py-3! max-sm:text-xs!"
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
