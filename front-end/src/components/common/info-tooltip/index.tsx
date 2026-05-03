import { ReactNode, useCallback, useState } from 'react';
import tooltipIconGray from '../../../assets/icons/common/tooltip-icon.svg';
import { classNames } from '../../../lib/utils';

export const InfoTooltip = ({
  content,
  icon = 'gray',
  className = '',
  tooltipClass = '',
  isHoverable = false,
  isClickable = true,
}: {
  content: ReactNode;
  icon?: 'gray' | 'blue';
  className?: string;
  tooltipClass?: string;
  isHoverable?: boolean;
  isClickable?: boolean;
}) => {
  const [shouldShowTooltip, setShouldShowTooltip] = useState(false);

  const handleToggleTooltip = useCallback(() => {
    if (!isClickable) return;
    setShouldShowTooltip((prevState) => {
      if (prevState) return false;
      return true;
    });
  }, [isClickable]);

  const handleHoverIn = useCallback(() => {
    if (!isHoverable) return;
    setShouldShowTooltip(true);
  }, [isHoverable]);

  const handleHoverOut = useCallback(() => {
    if (!isHoverable) return;
    setShouldShowTooltip(false);
  }, [isHoverable]);

  return (
    <div className={classNames('relative', isClickable ? 'cursor-pointer' : 'cursor-default', className)}>
      <img
        onMouseEnter={handleHoverIn}
        onMouseLeave={handleHoverOut}
        onClick={handleToggleTooltip}
        src={icon === 'gray' ? tooltipIconGray : tooltipIconGray}
        alt="tooltip"
        className="min-w-4.5 select-none"
      />
      {shouldShowTooltip && (
        <div className={classNames('absolute rounded-[5px] bg-[#08152A] p-2 text-center text-[10px]', tooltipClass)}>
          {content}
        </div>
      )}
    </div>
  );
};
