import { use, useState } from 'react';
import copyIcon from '../../../assets/icons/common/copy-icon.svg';
import checkIcon from '../../../assets/icons/common/check-icon-green.svg';
import { classNames } from '../../../lib/utils';
import { ModalContext, ModalProps } from '../../../providers/modal/context';
import { findColorResult } from '../../lobby/roulette/utils';
import { notify } from '../../toast';

export const FairnessVerificationDataModal = ({ fairnessData }: ModalProps<'fairness-verification-data'>) => {
  const { closeModal } = use(ModalContext);
  const [isCopied, setIsCopied] = useState(false);
  const [serverSeedCopied, setServerSeedCopied] = useState(false);
  const [fairnessRandomCopied, setFairnessRandomCopied] = useState(false);

  const handleCopy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard
      .writeText(text ?? '')
      .then(() => {
        notify('success', { title: 'Success', content: 'Copied to clipboard' });
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
          setServerSeedCopied(false);
          setFairnessRandomCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  const handleCloseModal = () => {
    closeModal(true);
  };

  const sliceText = (text: string, chars = 10) => {
    if (!text) return '';
    return text.length > chars * 2 ? `${text.slice(0, chars)}...${text.slice(-chars)}` : text;
  };

  return (
    <div className="flex min-h-[210px] max-w-[682px] min-w-[550px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-center border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className="text-white">Fairness verification data</span>
        </div>
      </div>
      <div className="w-full text-lg font-extrabold text-[#6E88AF]">
        <div className="flex w-full flex-col items-center justify-center gap-5">
          <div className="flex w-full flex-col gap-2 px-4 py-3 text-sm text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">Server Seed:</span>
              <div className="flex items-center gap-3 text-white">
                <button
                  onClick={() => handleCopy(fairnessData.serverSeed)}
                  type="button"
                  className="min-h-5 cursor-pointer rounded-[5px] bg-[#1D3353] px-[5px] py-[5px] font-bold text-[#6E88AF]"
                >
                  {isCopied && serverSeedCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
                </button>
                {sliceText(fairnessData.serverSeed, 15)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Fairness Random:</span>
              <div className="flex items-center gap-3 text-white">
                <button
                  onClick={() => handleCopy(fairnessData.fairnessRandom)}
                  type="button"
                  className="min-h-5 cursor-pointer rounded-[5px] bg-[#1D3353] px-[5px] py-[5px] font-bold text-[#6E88AF]"
                >
                  {isCopied && fairnessRandomCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
                </button>
                {sliceText(fairnessData.fairnessRandom, 15)}
              </div>
            </div>
            <div>
              {Array.isArray(fairnessData.result) && (
                <>
                  <span className="text-base font-semibold">Deck:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {fairnessData.result.map((card, index) => (
                      <span
                        key={index}
                        className="items-center rounded bg-[#6E88AF] px-2 py-1 font-mono text-sm text-[#1C2C48]"
                      >
                        {card}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {Number.isInteger(fairnessData.result) && (
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold">Game Result: </span>
                  <div
                    className={classNames(
                      'z-1 flex max-h-7 min-h-7 min-w-12 items-center justify-center rounded-[5px] text-lg font-extrabold text-white',
                      {
                        'bg-[#328C3C]': findColorResult(fairnessData.result.toString()) === 'green',
                        'bg-[#FF3C48]': findColorResult(fairnessData.result.toString()) === 'red',
                        'bg-[#364E71]': findColorResult(fairnessData.result.toString()) === 'black',
                      },
                    )}
                  >
                    {fairnessData.result}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex w-full items-center justify-center gap-6 px-9 py-6 max-md:px-3.5">
            <div
              onClick={handleCloseModal}
              className="btn-common btn-primary hover-base items-center max-sm:justify-center max-sm:!py-3"
            >
              Close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
