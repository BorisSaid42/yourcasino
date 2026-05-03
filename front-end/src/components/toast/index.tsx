import { ReactNode } from '@tanstack/react-router';
import { toast, ToastContentProps, ToastOptions } from 'react-toastify';
import { SuccessNotification } from './sucess-notification';
import { ErrorNotification } from './error-notification';
import { InfoNotification } from './info-notification';

export type NotificationType = 'success' | 'success_one' | 'success_two' | 'error' | 'info' | 'warning';

export interface INotificationAction {
  label: string;
  onClick: () => void;
}

export interface INotificationData {
  title?: string;
  content: string | ReactNode;
  action?: INotificationAction;
  boxValue?: string;
}

export function notify(
  type: NotificationType,
  options: INotificationData,
  toastOptions?: ToastOptions<INotificationData>,
) {
  const content = (toastProps: ToastContentProps<INotificationData>) => {
    switch (type) {
      case 'success':
      case 'success_one':
      case 'success_two':
        return <SuccessNotification {...toastProps} data={options} />;
      case 'error':
        return <ErrorNotification {...toastProps} data={options} />;
      case 'info':
        return <InfoNotification {...toastProps} data={options} />;
      case 'warning':
        return <InfoNotification {...toastProps} data={options} />;
      default:
        return <SuccessNotification {...toastProps} data={options} />;
    }
  };

  toast<INotificationData>(content, {
    ...toastOptions,
    data: options,
    className: 'max-md:min-w-[250px] p-0 max-w-fit min-w-[392px]',
  });
}
