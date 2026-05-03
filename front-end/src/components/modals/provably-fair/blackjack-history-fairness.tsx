import { format } from 'date-fns';
import { use, useState } from 'react';
import copyIcon from '../../../assets/icons/common/copy-icon.svg';
import checkIcon from '../../../assets/icons/common/check-icon-green.svg';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import { ModalContext, ModalProps } from '../../../providers/modal/context';
import { BlackjackFairnessHistoryData, useBlackjackProvablyFairHistory } from '../../../queries/blackjack';
import { notify } from '../../toast';
import { BreakpointEnum, useBreakpoint } from '../../../lib/utils';

export const BlackjackFairnessHistoryModal = ({ lobbyId }: ModalProps<'blackjack-fairness-history-modal'>) => {
  const { closeModal } = use(ModalContext);
  const [isCopied, setIsCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [serverSeedCopied, setServerSeedCopied] = useState(false);
  const [fairnessRandomCopied, setFairnessRandomCopied] = useState(false);
  const { data: provablyFairHistoryData } = useBlackjackProvablyFairHistory(lobbyId);

  const isSmallerScreen = useBreakpoint(BreakpointEnum.SM);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard
      .writeText(text ?? '')
      .then(() => {
        notify('success', { title: 'Success', content: 'Copied to clipboard' });
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
          setIdCopied(false);
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

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="flex h-[560px] min-w-[650px] flex-col rounded-xl bg-[#152947] pr-1 max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      {/* Header */}
      <div className="relative flex items-center justify-center border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className="text-xl text-white">Blackjack Game History</span>
        </div>
        <button
          onClick={() => closeModal()}
          className="absolute top-4 right-4 cursor-pointer rounded-[5px] bg-[#182E51] p-3.5"
        >
          <img src={crossIcon} />
        </button>
      </div>

      {/* List */}
      <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-[#253C60CC] scrollbar-track-[#6E88AF] h-[460px] w-full overflow-y-auto border-b border-[#12223B] px-6 py-6 text-lg font-extrabold text-[#6E88AF]">
        {provablyFairHistoryData && (
          <div className="flex w-full flex-col gap-3">
            {provablyFairHistoryData.map((gameData: BlackjackFairnessHistoryData) => {
              const isOpen = expandedRow === gameData.id;
              return (
                <div key={gameData.id} className="rounded-[8px] bg-[#253C60CC] hover:bg-[#253C60]">
                  {/* Row */}
                  <div
                    onClick={() => toggleRow(gameData.id)}
                    className="flex cursor-pointer items-center justify-between px-4 py-2"
                  >
                    <div className="text-base">{format(gameData.updatedAt, 'MMM do, yyyy HH:mm')}</div>
                    <span className="text-base font-bold text-white">{gameData.id}</span>
                  </div>

                  {/* Dropdown Content */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div
                      className={`overflow-hidden transition-opacity duration-300 ${
                        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                      }`}
                    >
                      <div className="flex max-w-[600px] flex-col gap-2 px-4 py-3 text-sm text-white">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">Number of Decks:</span>{' '}
                          <div className="flex items-center gap-3 text-white">{gameData.numOfDecks}</div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">Game ID:</span>{' '}
                          <div className="flex items-center gap-3 text-white">
                            <button
                              onClick={() => {
                                handleCopy(gameData.id);
                                setIdCopied(true);
                              }}
                              type="button"
                              className="min-h-5 cursor-pointer rounded-[5px] bg-[#1D3353] px-[5px] py-[5px] font-bold text-[#6E88AF]"
                            >
                              {isCopied && idCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
                            </button>
                            {gameData.id}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">Server Seed:</span>
                          <div className="flex items-center gap-3 text-white">
                            <button
                              onClick={() => {
                                handleCopy(gameData.serverSeed);
                                setServerSeedCopied(true);
                              }}
                              type="button"
                              className="min-h-5 cursor-pointer rounded-[5px] bg-[#1D3353] px-[5px] py-[5px] font-bold text-[#6E88AF]"
                            >
                              {isCopied && serverSeedCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
                            </button>
                            {sliceText(gameData.serverSeed, 15)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Fairness Random:</span>
                          <div className="flex items-center gap-3 text-white">
                            <button
                              onClick={() => {
                                handleCopy(gameData.fairnessRandom);
                                setFairnessRandomCopied(true);
                              }}
                              type="button"
                              className="min-h-5 cursor-pointer rounded-[5px] bg-[#1D3353] px-[5px] py-[5px] font-bold text-[#6E88AF]"
                            >
                              {isCopied && fairnessRandomCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
                            </button>
                            {sliceText(gameData.fairnessRandom, isSmallerScreen ? 15 : 20)}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold">Deck:</span>
                          <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-[#253C60CC] scrollbar-track-[#6E88AF] mt-1 flex max-h-48 flex-wrap gap-2 overflow-y-auto px-1">
                            {gameData.deck.map((card, index) => (
                              <span key={index} className="rounded bg-[#1C2C48] px-2 py-1 font-mono text-xs">
                                {card}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex w-full items-center justify-center py-5">
        <div onClick={handleCloseModal} className="btn-common btn-secondary hover-base max-sm:!py-3 max-sm:text-center">
          Close
        </div>
      </div>
    </div>
  );
};
