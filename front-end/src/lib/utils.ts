import { type ClassValue, clsx } from 'clsx';
import { useSyncExternalStore } from 'react';
import { twMerge } from 'tailwind-merge';
import { notify } from '../components/toast';

export function classNames(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseChip(amount: number): number {
  const denominations = [0.5, 1, 5, 10, 25, 50, 100];
  // Pick the highest denomination less than or equal to the total amount
  return denominations.reverse().find((d) => amount >= d) || 0.5;
}

export function getRandomString(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const truncateTo = (num?: number, decimals = 2): number => {
  if (typeof num !== 'number' || isNaN(num)) return 0;

  const factor = Math.pow(10, decimals);
  return Math.floor(num * factor) / factor;
};

export const formatBalance = (num?: number, decimals = 2): string => {
  const truncated = truncateTo(num, decimals);
  return truncated.toFixed(decimals);
};

export const handleCopyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value);
  notify('success', { content: 'Copied to clipboard', title: 'Success' });
};

export enum BreakpointEnum {
  XXS = 'xxs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
  XXL = '2xl',
}

export const formatTimeAgo = (dateString: string | Date) => {
  const diffMs = Date.now() - new Date(dateString).getTime();

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? `${parts.join(' ')} ago` : 'Just now';
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const breakpoints: Record<BreakpointEnum, number> = {
  [BreakpointEnum.XXS]: 450,
  [BreakpointEnum.SM]: 640,
  [BreakpointEnum.MD]: 768,
  [BreakpointEnum.LG]: 1024,
  [BreakpointEnum.XL]: 1280,
  [BreakpointEnum.XXL]: 1536,
};

export const mapCryptoSymbolToName = (symbol: string): string => {
  switch (symbol) {
    case 'BTC':
      return 'Bitcoin';
    case 'USDT':
      return 'Tether';
    case 'ETH':
      return 'Ethereum';
    case 'SOL':
      return 'Solana';
    case 'LTC':
      return 'Litecoin';
    default:
      return '';
  }
};

export const mapTxHashToLink = (symbol: string, txHash: string): string => {
  switch (symbol) {
    case 'BTC':
      return `https://www.blockchain.com/explorer/transactions/btc/${txHash}`;
    case 'USDT':
    case 'ETH':
      return `https://etherscan.io/tx/${txHash}`;
    case 'SOL':
      return `https://solscan.io/tx/${txHash}`;
    case 'LTC':
      return `https://www.blockchain.com/explorer/transactions/ltc/${txHash}`;
    default:
      return '';
  }
};

export const capitalizeFirstLetter = (val: string): string => {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
};

export function useBreakpoint(breakpointKey: BreakpointEnum = BreakpointEnum.LG): boolean {
  const breakpoint = breakpoints[breakpointKey];
  const mediaQuery = `(max-width: ${breakpoint - 1}px)`;

  const subscribe = (callback: () => void) => {
    const media = window.matchMedia(mediaQuery);
    media.addEventListener('change', callback);
    return () => media.removeEventListener('change', callback);
  };

  const getSnapshot = () => window.matchMedia(mediaQuery).matches;

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
