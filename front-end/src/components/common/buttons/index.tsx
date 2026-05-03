import { ReactNode } from '@tanstack/react-router';
import clsx from 'clsx';
import { JSX } from 'react';

export interface IGenericButtonProps {
  text?: string;
  skin?: 'primary' | 'secondary' | 'tertiary' | 'secondaryDark' | 'register' | 'betControl' | 'darkerBlue';
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  isFullWidth?: boolean;
  isProcessing?: boolean;
  isDisabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
  className?: string;
  padding?: string;
  bgColor?: string;
}

export const GenericButton = ({
  text,
  skin,
  leftIcon,
  rightIcon,
  isFullWidth = false,
  isProcessing = false,
  isDisabled = false,
  className,
  bgColor,
  padding = 'px-6 py-4',
  children,
  type = 'button',
  onClick,
}: IGenericButtonProps) => {
  const baseStyles =
    'flex cursor-pointer items-center justify-center gap-2 rounded-[5px] font-bold transition-colors duration-300 disabled:opacity-80 disabled:cursor-default';

  const skinStyles = {
    primary: 'bg-[#4486DD] text-white enabled:hover:bg-[#5898E6]',
    secondary: 'bg-[#6E88AF] text-white enabled:hover:bg-[#60799C]',
    tertiary: 'bg-transparent text-white enabled:hover:bg-[rgba(255,255,255,0.1)]',
    secondaryDark: 'bg-[#2F4669] text-white enabled:hover:bg-[#273B59]',
    register: 'bg-[#00CF56] text-white enabled:hover:bg-[#00B84C]',
    betControl:
      'gap-[6px] rounded-[8px] border border-[#ffffff24] bg-[#ffffff24] px-[11px] py-[10px] text-[13px] font-bold enabled:hover:bg-[#ffffff33] hover:backdrop-blur-sm transition-all duration-500 max-sm:text-[10px]',
    darkerBlue: 'bg-[#1D3353DD] enabled:hover:bg-[#1D3353]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled || isProcessing}
      className={clsx(baseStyles, padding, skin && skinStyles[skin], isFullWidth && 'w-full', bgColor, className)}
    >
      {isProcessing && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      )}
      {!isProcessing && leftIcon}
      {text && <span>{text}</span>}
      {children}
      {!isProcessing && rightIcon}
    </button>
  );
};
