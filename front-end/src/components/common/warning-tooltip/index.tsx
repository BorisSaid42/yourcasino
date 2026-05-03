import { useCallback, useState } from 'react';
import warningIcon from '../../../assets/icons/common/warning-icon.svg';

export const WarningTooltip = () => {
  const [shouldShowTooltip, setShouldShowTooltip] = useState(false);

  const handleToggleTooltip = useCallback(() => {
    setShouldShowTooltip((prevState) => !prevState);
  }, []);

  return (
    <div
      onMouseEnter={() => setShouldShowTooltip(true)}
      onMouseLeave={() => setShouldShowTooltip(false)}
      onClick={handleToggleTooltip}
      className="absolute top-1/2 -right-[30px] z-20 -translate-y-1/2 cursor-pointer max-sm:left-[-24px]"
    >
      <img src={warningIcon} width={20} alt="warning" />
      {shouldShowTooltip && (
        <div className="absolute -top-[100%] left-[30px] min-w-[200px] rounded-[5px] bg-[#152947] px-2.5 py-2 text-[10px] font-semibold tracking-wide text-[#ffa500e3]">
          Theoretical round max win exceeds bankroll. There is a scenario where player winnings are greater than
          bankroll. Winnings will be paid out proportionally if this is reached.
        </div>
      )}
    </div>
  );
};
