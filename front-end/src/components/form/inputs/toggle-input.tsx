import { forwardRef, type InputHTMLAttributes } from 'react';
import { classNames } from '../../../lib/utils';

export type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(({ className, ...props }, ref) => {
  return (
    <label className="relative inline-flex cursor-pointer items-center" htmlFor={props.id}>
      <input type="checkbox" className={classNames('peer sr-only', className)} ref={ref} {...props} />
      <div
        className={classNames(
          'h-6 w-11 rounded-full bg-[#08152A] peer-focus:ring-2 peer-focus:ring-transparent peer-focus:outline-none',
          'transition-colors duration-300 peer-checked:bg-[#4486DD]',
        )}
      />
      <div
        className={classNames(
          'absolute top-1 left-1 h-4 w-4 rounded-full bg-[#1D3353] transition-transform duration-200',
          'duration-300 peer-checked:translate-x-5 peer-checked:bg-white',
        )}
      />
    </label>
  );
});

Toggle.displayName = 'Toggle';

export { Toggle };
