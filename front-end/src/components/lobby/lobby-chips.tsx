import chip0_5side from '../../assets/icons/chip/chip-0_5-side.svg';
import chip1side from '../../assets/icons/chip/chip-1-side.svg';
import chip10side from '../../assets/icons/chip/chip-10-side.svg';
import chip100side from '../../assets/icons/chip/chip-100-side.svg';
import chip5side from '../../assets/icons/chip/chip-5-side.svg';
import chip50side from '../../assets/icons/chip/chip-50-side.svg';
import { classNames } from '../../lib/utils';

export const TableChips = ({ className = '' }: { className?: string }) => {
  return (
    <div className={classNames('absolute top-3 left-1/2 -translate-x-1/2', className)}>
      <div className="flex items-center gap-2 rounded-b-[40px] bg-[#112B54] px-[43px] pt-0.5 pb-3.5 font-bold text-[#60A4FD] shadow-[0_6px_0_0_#0D2446]">
        <div className="flex h-[62px] w-[18px] flex-col items-center gap-0.5 bg-[#0F213B] pt-0.5">
          <img className="w-3" src={chip50side} />
          <img className="w-3" src={chip50side} />
          <img className="w-3" src={chip50side} />
          <img className="w-3" src={chip50side} />
          <img className="w-3" src={chip50side} />
          <img className="w-3" src={chip50side} />
          <img className="w-3" src={chip50side} />
          <img className="w-3" src={chip50side} />
          <img className="w-3" src={chip50side} />
          <img className="w-3" src={chip50side} />
        </div>
        <div className="flex h-[62px] w-[18px] flex-col items-center gap-0.5 bg-[#0F213B] pt-0.5">
          <img className="w-3" src={chip0_5side} />
          <img className="w-3" src={chip0_5side} />
          <img className="w-3" src={chip0_5side} />
          <img className="w-3" src={chip0_5side} />
          <img className="w-3" src={chip0_5side} />
          <img className="w-3" src={chip0_5side} />
          <img className="w-3" src={chip0_5side} />
          <img className="w-3" src={chip0_5side} />
          <img className="w-3" src={chip0_5side} />
        </div>
        <div className="flex h-[62px] w-[18px] flex-col items-center gap-0.5 bg-[#0F213B] pt-0.5">
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
          <img className="w-3" src={chip1side} />
        </div>
        <div className="flex h-[62px] w-[18px] flex-col items-center gap-0.5 bg-[#0F213B] pt-0.5">
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
          <img className="w-3" src={chip10side} />
        </div>
        <div className="flex h-[62px] w-[18px] flex-col items-center gap-0.5 bg-[#0F213B] pt-0.5">
          <img className="w-3" src={chip5side} />
          <img className="w-3" src={chip5side} />
          <img className="w-3" src={chip5side} />
          <img className="w-3" src={chip5side} />
          <img className="w-3" src={chip5side} />
          <img className="w-3" src={chip5side} />
          <img className="w-3" src={chip5side} />
          <img className="w-3" src={chip5side} />
          <img className="w-3" src={chip5side} />
          <img className="w-3" src={chip5side} />
        </div>
        <div className="flex h-[62px] w-[18px] flex-col items-center gap-0.5 bg-[#0F213B] pt-0.5">
          <img className="w-3" src={chip100side} />
          <img className="w-3" src={chip100side} />
          <img className="w-3" src={chip100side} />
          <img className="w-3" src={chip100side} />
          <img className="w-3" src={chip100side} />
          <img className="w-3" src={chip100side} />
          <img className="w-3" src={chip100side} />
        </div>
      </div>
    </div>
  );
};
