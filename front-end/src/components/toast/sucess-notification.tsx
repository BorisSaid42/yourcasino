import { ToastContentProps } from 'react-toastify';
import { INotificationData } from '.';
import { classNames } from '../../lib/utils';
import greenDollarIcon from '../../assets/icons/common/dollar-icon-green.svg';
import crossIcon from '../../assets/icons/common/cross-icon.svg';

export function SuccessNotification({ data, closeToast }: ToastContentProps<INotificationData>) {
  return (
    <div className={classNames('flex w-full items-center gap-3 rounded-xl bg-[#182E51] px-4 py-3')}>
      <div className="min-w-5">{data?.boxValue ? <img src={data.boxValue} /> : <img src={greenDollarIcon} />}</div>
      <div className="flex flex-col">
        <div className="text-base font-extrabold text-[#4EC87D]">{data?.title}</div>
        <div className="text-sm font-bold text-white">{data?.content}</div>
      </div>
      <button onClick={closeToast} className="nav-button ml-auto rounded-md p-1 transition" aria-label="Close">
        <img src={crossIcon} className="h-4 min-w-4 text-white" />
      </button>
    </div>
  );
}
