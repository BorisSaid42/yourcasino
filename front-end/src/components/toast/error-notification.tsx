import { ToastContentProps } from 'react-toastify';
import { classNames } from '../../lib/utils';
import { INotificationData } from '.';
import crossIcon from '../../assets/icons/common/cross-icon.svg';

export function ErrorNotification({ data, closeToast }: ToastContentProps<INotificationData>) {
  return (
    <div className={classNames('flex w-full items-center gap-3 rounded-xl bg-[#182E51] px-4 py-3')}>
      {/* <div className="min-w-5">{data.boxValue ? <img src={data.boxValue} /> : <img width={16} src={crossIcon} />}</div> */}
      <div className="flex flex-col">
        <div className="text-base font-extrabold text-[#FFFFFFB8]">{data?.title}</div>
        <div className="text-sm font-bold text-white">{data?.content}</div>
      </div>
      <button onClick={closeToast} className="nav-button ml-auto rounded-md p-1 transition" aria-label="Close">
        <img src={crossIcon} className="h-4 min-w-4 text-white" />
      </button>
    </div>
  );
}
