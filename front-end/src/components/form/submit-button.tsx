import { useStore } from '@tanstack/react-form';
import { type ButtonHTMLAttributes } from 'react';
import { classNames } from '../../lib/utils';
import { useFormContext } from './provider';

export const SubmitButton = ({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => {
  const form = useFormContext();
  const [isSubmitting, canSubmit] = useStore(form.store, (state) => [state.isSubmitting, state.canSubmit]);

  const isDisabled = isSubmitting && canSubmit;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={classNames('w-full py-4 font-bold text-white', className)}
      {...props}
    >
      {children}
    </button>
  );
};
