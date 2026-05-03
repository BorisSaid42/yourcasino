import { HTMLAttributes } from 'react';
import { classNames } from '../../lib/utils';
import { Label, LabelProps } from './inputs/label';
import { useFieldContext } from './provider';

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  options: SelectOption[];
  labelProps?: LabelProps;
} & HTMLAttributes<HTMLElement>;

export const SelectField = ({ options, labelProps, className, ...props }: SelectFieldProps) => {
  const field = useFieldContext<string>();
  // const hasError = field.state.meta.errors.length > 0 && field.state.meta.isTouched;

  // useFieldErrorsToast({ hasError, meta: field.state.meta });

  return (
    <div className={classNames('flex w-fit flex-col gap-1.5 lg:gap-3', className)} {...props}>
      {labelProps && (
        <Label htmlFor={field.name} {...labelProps}>
          {labelProps.children}
        </Label>
      )}
      <div className="flex items-center gap-2">
        {options.map((option) => {
          const isSelected = field.state.value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => field.handleChange(option.value)}
              onBlur={field.handleBlur}
              className={classNames(
                'shadow-coinflip-select-shadow cursor-pointer rounded-lg border border-[#08152A] bg-[#08152A] px-[11px] py-[5px] transition-all duration-200',
                {
                  'border-[#4486DD]': isSelected,
                  'hover:border-[#6E88AF8F]': !isSelected,
                },
              )}
            >
              {' '}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
