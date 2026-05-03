import { forwardRef, type InputHTMLAttributes } from 'react';
import { classNames } from '../../../lib/utils';

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={classNames(
        'w-full rounded-lg border border-[#272727] bg-[#0B0A0A] p-4 pr-16 font-bold text-[#767676] placeholder-[#767676] disabled:bg-[#272727] max-md:p-3 max-md:text-[13px]',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
