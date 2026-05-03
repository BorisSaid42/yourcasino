import { useCallback, useState } from 'react';
import { WithdrawModalOptions } from './withdraw-modal-options';
import { WithdrawDetails } from './withdraw-details';
import { IPaymentMethod } from '../../../lib/payment-methods';

export const WithdrawModalContent = () => {
  const [withdrawMethod, setWithdrawMethod] = useState<IPaymentMethod | null>(null);

  const handleWithdrawMethod = useCallback((method: IPaymentMethod | null) => {
    setWithdrawMethod(method);
  }, []);
  return (
    <>
      {!withdrawMethod ? (
        <WithdrawModalOptions handleWithdrawMethod={handleWithdrawMethod} />
      ) : (
        <WithdrawDetails selectedMethod={withdrawMethod} handleWithdrawMethod={handleWithdrawMethod} />
      )}
    </>
  );
};
