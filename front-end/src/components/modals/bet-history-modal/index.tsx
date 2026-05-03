import { use, useState } from 'react';
import { ModalContext } from '../../../providers/modal/context';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import { BlackjackBetHistory } from './blackjack-bet-history';
import { RouletteBetHistory } from './roulette-bet-history';

export const BetHistoryModal = () => {
  const { closeModal } = use(ModalContext);
  const [activeTab, setActiveTab] = useState<'Blackjack' | 'Roulette'>('Blackjack');

  return (
    <div className="flex min-h-[320px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-between border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold text-[#465B7C]">
          <span
            onClick={() => setActiveTab('Blackjack')}
            className={`cursor-pointer ${activeTab === 'Blackjack' ? 'text-white' : ''}`}
          >
            Blackjack History
          </span>
          <span
            onClick={() => setActiveTab('Roulette')}
            className={`cursor-pointer ${activeTab === 'Roulette' ? 'text-white' : ''}`}
          >
            Roulette History
          </span>
        </div>
        <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      {activeTab === 'Blackjack' && <BlackjackBetHistory />}
      {activeTab === 'Roulette' && <RouletteBetHistory />}
    </div>
  );
};
