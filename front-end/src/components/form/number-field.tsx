import { type HTMLAttributes } from 'react';
import { classNames } from '../../lib/utils';
import { FieldErrors } from './field-errors';
import { Label, type LabelProps } from './inputs/label';
import { NumberInput, type NumberInputProps } from './inputs/number-input';
import { useFieldContext } from './provider';

type NumberFieldProps = {
  labelProps?: LabelProps;
  inputProps?: NumberInputProps;
} & HTMLAttributes<HTMLElement>;

export const NumberField = ({ labelProps, inputProps, className, children, ...props }: NumberFieldProps) => {
  const field = useFieldContext<string>();
  const hasError = field.state.meta.errors.length > 0 && field.state.meta.isTouched;

  const { className: inputClassName, ...restInputProps } = inputProps ?? {};

  return (
    <div className={classNames('flex w-full flex-col gap-1.5', className)} {...props}>
      {labelProps && (
        <Label htmlFor={field.name} {...labelProps}>
          {labelProps.children}
        </Label>
      )}
      <NumberInput
        id={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        className={classNames({ 'border-error-red': hasError }, inputClassName)}
        {...restInputProps}
      />
      <FieldErrors hasError={hasError} meta={field.state.meta} />
      {children}
    </div>
  );
};
