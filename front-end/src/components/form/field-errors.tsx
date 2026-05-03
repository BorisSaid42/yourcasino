import { type AnyFieldMeta } from '@tanstack/react-form';
import { ZodError } from 'zod';

type FieldErrorsProps = {
  meta: AnyFieldMeta;
  hasError: boolean;
};

export const FieldErrors = ({ meta, hasError }: FieldErrorsProps) => {
  if (!hasError) return null;

  return (
    <div className="text-error-red absolute top-full left-0 py-1 text-xs font-medium">
      {meta.errors.slice(0, 1).map(({ message }: ZodError) => (
        <p key={`field-error-${message}`}>{message}</p>
      ))}
    </div>
  );
};
