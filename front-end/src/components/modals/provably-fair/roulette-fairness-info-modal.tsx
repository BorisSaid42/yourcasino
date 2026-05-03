import { use, useState } from 'react';
import { ModalContext, ModalProps } from '../../../providers/modal/context';
import { useRouletteProvablyFair } from '../../../queries/roulette';
import copyIcon from '../../../assets/icons/common/copy-icon.svg';
import checkIcon from '../../../assets/icons/common/check-icon-green.svg';
import { classNames } from '../../../lib/utils';
import { findColorResult } from '../../lobby/roulette/utils';
import { notify } from '../../toast';
import { GenericButton } from '../../common/buttons';

export const RouletteProvablyFairModal = ({ gameId }: ModalProps<'roulette-fairness-modal'>) => {
  const { closeModal } = use(ModalContext);
  const [isCopied, setIsCopied] = useState(false);
  const [serverSeedCopied, setServerSeedCopied] = useState(false);
  const [serverSeedHashCopied, setServerSeedHashCopied] = useState(false);
  const [fairnessRandomCopied, setFairnessRandomCopied] = useState(false);
  const { data: provablyFairData } = useRouletteProvablyFair(gameId);

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
          setServerSeedHashCopied(false);
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
    <div className="flex min-h-[260px] min-w-[600px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-center border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className="text-xl text-white">Roulette Game Fairness</span>
        </div>
      </div>
      <div className="w-full border-b border-[#12223B] px-6 py-6 text-lg font-extrabold text-[#6E88AF]">
        {provablyFairData && (
          <div className="flex w-full flex-col gap-5">
            <div className="flex justify-between">
              <span className="text-base font-bold">Game Result: </span>
              <div
                className={classNames(
                  'z-1 flex max-h-7 min-h-7 min-w-12 items-center justify-center rounded-[5px] text-lg font-extrabold text-white',
                  {
                    'bg-[#328C3C]': findColorResult(provablyFairData.result.toString()) === 'green',
                    'bg-[#FF3C48]': findColorResult(provablyFairData.result.toString()) === 'red',
                    'bg-[#364E71]': findColorResult(provablyFairData.result.toString()) === 'black',
                  },
                )}
              >
                {provablyFairData.result}
              </div>
              {/* <span className="text-base font-bold text-white">{provablyFairData.result}</span> */}
            </div>
            <div className="flex justify-between">
              <span className="text-base font-bold">Game ID: </span>
              <span className="text-base font-bold text-white">{provablyFairData.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base font-bold">Server Seed: </span>
              <div className="flex items-center gap-3 text-base font-bold text-white">
                <GenericButton
                  onClick={() => {
                    handleCopy(provablyFairData.serverSeed);
                    setServerSeedCopied(true);
                  }}
                  leftIcon={isCopied && serverSeedCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
                  type="button"
                  className="min-h-7 text-[#6E88AF]"
                  padding="px-2 py-[5px]"
                  skin="darkerBlue"
                />
                {sliceText(provablyFairData.serverSeed, 15)}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-base font-bold">Server Seed Hash: </span>
              <div className="flex items-center gap-3 text-base font-bold text-white">
                <GenericButton
                  onClick={() => {
                    handleCopy(provablyFairData.serverSeedHash);
                    setServerSeedHashCopied(true);
                  }}
                  leftIcon={isCopied && serverSeedHashCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
                  type="button"
                  className="min-h-7 text-[#6E88AF]"
                  padding="px-2 py-[5px]"
                  skin="darkerBlue"
                />
                {sliceText(provablyFairData.serverSeedHash, 15)}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-base font-bold">Random.org random string: </span>
              <div className="flex items-center gap-3 text-base font-bold text-white">
                <GenericButton
                  onClick={() => {
                    handleCopy(provablyFairData.fairnessRandom);
                    setFairnessRandomCopied(true);
                  }}
                  leftIcon={isCopied && fairnessRandomCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
                  type="button"
                  className="min-h-7 text-[#6E88AF]"
                  padding="px-2 py-[5px]"
                  skin="darkerBlue"
                />
                {sliceText(provablyFairData.fairnessRandom, 15)}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex w-full items-center justify-center py-5">
        <div onClick={handleCloseModal} className="btn-common btn-secondary hover-base max-sm:!py-3 max-sm:text-center">
          Close
        </div>
      </div>
    </div>
  );
};
