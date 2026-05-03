import copyIcon from '../../../assets/icons/common/copy-icon.svg';
import checkIcon from '../../../assets/icons/common/check-icon-green.svg';
import { classNames } from '../../../lib/utils';
import { notify } from '../../toast';
import { useState } from 'react';

interface ICopyButtonProps {
  copyLink: string;
  className?: string;
  text?: string;
}

export const CopyButton = ({ copyLink, className = '', text = 'Copy' }: ICopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = async () => {
    if (!copyLink) return;

    await navigator.clipboard
      .writeText(copyLink)
      .then(() => {
        notify('success', { content: 'Copied to clipboard', title: 'Success' });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <button
      onClick={handleCopy}
      className={classNames(
        'cursor-pointer rounded-[5px] bg-[#1D3353] px-5 py-2 duration-200 hover:opacity-85',
        className,
      )}
      title={text}
    >
      {isCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
    </button>
  );
};
