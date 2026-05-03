import { type ChangeEvent, type FocusEvent, forwardRef, type InputHTMLAttributes, useCallback, useMemo } from 'react';
import { classNames } from '../../../lib/utils';

export type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'defaultValue'> & {
  decimals?: number;
};

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, decimals, onChange, onBlur, ...props }, ref) => {
    const applyDecimals = decimals ?? 4;
    const showVal = useMemo(
      () => (typeof value === 'number' ? (value || 0).toFixed(applyDecimals) : value),
      [applyDecimals, value],
    );

    const handleBlur = useCallback(
      (e: FocusEvent<HTMLInputElement>) => {
        const numericValue = +(showVal ?? '');
        if (Number.isNaN(numericValue)) {
          onChange?.({ target: { value: (0).toFixed(applyDecimals) } } as ChangeEvent<HTMLInputElement>);
        } else {
          onChange?.({ target: { value: numericValue.toFixed(applyDecimals) } } as ChangeEvent<HTMLInputElement>);
        }

        onBlur?.(e);
      },
      [applyDecimals, onBlur, onChange, showVal],
    );

    return (
      <input
        type="number"
        value={showVal}
        onChange={onChange}
        onBlur={handleBlur}
        className={classNames(
          'w-full rounded-lg border border-[#272727] bg-[#0B0A0A] p-4 pr-16 font-bold text-[#767676] placeholder-[#767676] duration-300 disabled:bg-[#253C60] disabled:text-[#6E88AF8F]',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
