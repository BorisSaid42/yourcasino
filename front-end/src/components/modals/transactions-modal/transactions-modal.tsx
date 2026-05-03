import { use, useState } from 'react';
import { ModalContext } from '../../../providers/modal/context';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import { DepositHistory } from './deposit-history';
import { WithdrawHistory } from './withdraw-history';

export const TRANSACTION_HEADERS = [
  { value: 'Method' },
  { value: 'Amount' },
  { value: 'Status' },
  { value: 'Date & Time' },
  { value: 'Txn' },
];

export const TransactionsModal = () => {
  const { closeModal } = use(ModalContext);
  const [activeTab, setActiveTab] = useState<'Deposit' | 'Withdraw'>('Deposit');

  return (
    <div className="flex min-h-[320px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-between border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold text-[#465B7C]">
          <span
            onClick={() => setActiveTab('Deposit')}
            className={`cursor-pointer ${activeTab === 'Deposit' ? 'text-white' : ''}`}
          >
            Deposit History
          </span>
          <span
            onClick={() => setActiveTab('Withdraw')}
            className={`cursor-pointer ${activeTab === 'Withdraw' ? 'text-white' : ''}`}
          >
            Withdraw History
          </span>
        </div>
        <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      {activeTab === 'Deposit' && <DepositHistory />}
      {activeTab === 'Withdraw' && <WithdrawHistory />}
    </div>
  );
};
