import { useStore } from '@tanstack/react-form';
import { type HTMLAttributes } from 'react';
import { classNames } from '../../lib/utils';
import { FieldErrors } from './field-errors';
import { Label, type LabelProps } from './inputs/label';
import { Toggle, type ToggleProps } from './inputs/toggle-input';
import { useFieldContext } from './provider';

type ToggleFieldProps = {
  labelProps: LabelProps;
  toggleProps?: ToggleProps;
} & HTMLAttributes<HTMLElement>;

export const ToggleField = ({ labelProps, toggleProps, className, ...props }: ToggleFieldProps) => {
  const field = useFieldContext<boolean>();
  const canSubmit = useStore(field.form.store, (state) => state.canSubmit);
  const hasError = field.state.meta.errors.length > 0 && !canSubmit;

  const { className: labelClassName, children, ...restLabelProps } = labelProps;
  const { className: toggleClassName, ...restToggleProps } = toggleProps ?? {};

  return (
    <div className={classNames('flex flex-col items-center gap-1.5', className)} {...props}>
      <div className="inline-flex items-center px-6">
        <Label htmlFor={field.name} className={classNames('mr-3', labelClassName)} {...restLabelProps}>
          {children}
        </Label>
        <Toggle
          id={field.name}
          checked={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.checked)}
          className={classNames({ 'border-error-red': hasError }, toggleClassName)}
          {...restToggleProps}
        />
      </div>
      <FieldErrors hasError={hasError} meta={field.state.meta} />
    </div>
  );
};
