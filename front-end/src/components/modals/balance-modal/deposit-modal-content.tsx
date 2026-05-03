import { useCallback, useState } from 'react';
import { DepositDetails } from './deposit-details';
import { DepositModalOptions } from './deposit-modal-options';
import { IPaymentMethod } from '../../../lib/payment-methods';

interface IDepositDetailsProps {
  method?: IPaymentMethod;
}

export const DepositModalContent = ({ method }: IDepositDetailsProps) => {
  const [depositMethod, setDepositMethod] = useState<IPaymentMethod | null>(method || null);

  const handleDepositMethod = useCallback((method: IPaymentMethod | null) => {
    setDepositMethod(method);
  }, []);

  return (
    <>
      {!depositMethod ? (
        <DepositModalOptions handleDepositMethod={handleDepositMethod} />
      ) : (
        <DepositDetails method={depositMethod} handleDepositMethod={handleDepositMethod} />
      )}
    </>
  );
};
