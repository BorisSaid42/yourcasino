import { useStore } from '@tanstack/react-form';
import { type HTMLAttributes } from 'react';
import { classNames } from '../../lib/utils';
import { FieldErrors } from './field-errors';
import { Checkbox, type CheckboxProps } from './inputs/checkbox-input';
import { Label, type LabelProps } from './inputs/label';
import { useFieldContext } from './provider';

type CheckboxFieldProps = {
  labelProps: LabelProps;
  checkboxProps?: CheckboxProps;
} & HTMLAttributes<HTMLElement>;

export const CheckboxField = ({ labelProps, checkboxProps, className, ...props }: CheckboxFieldProps) => {
  const field = useFieldContext<boolean>();
  const canSubmit = useStore(field.form.store, (state) => state.canSubmit);
  const hasError = field.state.meta.errors.length > 0 && !canSubmit;

  const { className: labelClassName, children, ...restLabelProps } = labelProps;
  const { className: checkboxClassName, ...restCheckboxProps } = checkboxProps ?? {};

  return (
    <div className={classNames('relative flex flex-col items-center gap-1.5', className)} {...props}>
      <div className="inline-flex items-center">
        <Checkbox
          id={field.name}
          checked={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.checked)}
          className={classNames({ 'border-error-red': hasError }, checkboxClassName)}
          {...restCheckboxProps}
        />
        <Label htmlFor={field.name} className={classNames('ml-3', labelClassName)} {...restLabelProps}>
          {children}
        </Label>
      </div>
      <FieldErrors hasError={hasError} meta={field.state.meta} />
    </div>
  );
};
