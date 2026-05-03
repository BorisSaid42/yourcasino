import { forwardRef, type LabelHTMLAttributes } from 'react';
import { classNames } from '../../../lib/utils';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, children, ...props }, ref) => {
  return (
    <label className={classNames('text-sm font-bold text-[#767676]', className)} ref={ref} {...props}>
      {children}
    </label>
  );
});
