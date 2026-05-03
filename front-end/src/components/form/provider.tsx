import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { CheckboxField } from './checkbox-field';
import { NumberField } from './number-field';
import { SubmitButton } from './submit-button';
import { TextField } from './text-field';
import { ToggleField } from './toggle-field';
import { SelectField } from './select-field';
import { SubmitButtonAlt } from './submit-button-alt';

export const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    NumberField,
    CheckboxField,
    ToggleField,
    SelectField,
  },
  formComponents: {
    SubmitButton,
    SubmitButtonAlt,
  },
  fieldContext,
  formContext,
});
