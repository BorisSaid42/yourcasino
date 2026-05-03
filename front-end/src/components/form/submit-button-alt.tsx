import { useStore } from '@tanstack/react-form';
import { useCallback, type ButtonHTMLAttributes } from 'react';
import { useFormContext } from './provider';
import { GenericButton } from '../common/buttons';
import { ReactNode } from '@tanstack/react-router';

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  skin?: 'primary' | 'secondary' | 'tertiary' | 'secondaryDark' | 'register';
  leftIcon?: ReactNode;
  padding?: string;
}

export const SubmitButtonAlt = ({
  className,
  children,
  skin,
  text,
  leftIcon,
  padding,
  ...props
}: SubmitButtonProps) => {
  const form = useFormContext();
  const [isSubmitting, canSubmit] = useStore(form.store, (state) => [state.isSubmitting, state.canSubmit]);

  const isDisabled = isSubmitting && canSubmit;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (props?.onClick) props.onClick(e);
    },
    [props],
  );

  return (
    <GenericButton
      text={text}
      skin={skin}
      type="submit"
      isDisabled={isDisabled}
      isProcessing={isSubmitting}
      onClick={handleClick}
      className={className}
      leftIcon={leftIcon}
      padding={padding}
    >
      {children}
    </GenericButton>
  );
};
