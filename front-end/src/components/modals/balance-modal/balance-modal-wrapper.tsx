import { use, useState } from 'react';
import { ModalContext } from '../../../providers/modal/context';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import { DepositModalContent } from './deposit-modal-content';
import { WithdrawModalContent } from './withdraw-modal-content';
import { IPaymentMethod } from '../../../lib/payment-methods';

interface IBalanceDetailsProps {
  method?: IPaymentMethod;
  type: 'deposit' | 'withdraw';
}

export const BalanceModal = ({ method, type }: IBalanceDetailsProps) => {
  const { closeModal } = use(ModalContext);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>(type);

  return (
    <div className="flex min-h-[320px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-start justify-between border-b border-b-[#12223B] px-9 pt-[21px] max-md:px-3.5 max-md:pt-4">
        <div className="flex items-start gap-6 text-base font-extrabold text-[#465B7C]">
          <span
            onClick={() => setActiveTab('deposit')}
            className={`cursor-pointer border-b pb-[31px] ${activeTab === 'deposit' ? 'border-[#60A4FD] text-white' : 'border-transparent'}`}
          >
            Deposit
          </span>
          <span
            onClick={() => setActiveTab('withdraw')}
            className={`cursor-pointer border-b pb-[31px] ${activeTab === 'withdraw' ? 'border-[#60A4FD] text-white' : 'border-transparent'}`}
          >
            Withdraw
          </span>
        </div>
        <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      {activeTab === 'deposit' && <DepositModalContent method={method} />}
      {activeTab === 'withdraw' && <WithdrawModalContent />}
    </div>
  );
};
