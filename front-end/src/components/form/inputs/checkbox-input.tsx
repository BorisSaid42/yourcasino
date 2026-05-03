import { forwardRef, type InputHTMLAttributes } from 'react';
import { classNames } from '../../../lib/utils';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => {
  return (
    <label className="relative flex cursor-pointer items-center" htmlFor="tos">
      <input
        type="checkbox"
        className={classNames(
          'peer h-5 w-5 cursor-pointer appearance-none rounded border border-[#272727] shadow transition-all checked:border-[#272727] checked:bg-[#0B0A0A] hover:shadow-md',
          className,
        )}
        ref={ref}
        {...props}
      />
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-white opacity-0 peer-checked:opacity-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          ></path>
        </svg>
      </span>
    </label>
  );
});
Checkbox.displayName = 'Checkbox';

export { Checkbox };
