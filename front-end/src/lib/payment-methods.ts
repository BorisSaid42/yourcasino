import bitcoinIcon from '../assets/icons/payment-methods/bitcoin-logo.png';
import ethIcon from '../assets/icons/payment-methods/eth-icon.png';
import liteCoinIcon from '../assets/icons/payment-methods/lite-coin-icon.png';
import solanaIcon from '../assets/icons/payment-methods/solana-icon.png';
import usdtIcon from '../assets/icons/payment-methods/usdt-icon.png';
import { useAssetPricesData } from '../queries/crypto';

export interface IPaymentMethod {
  name: string;
  icon: string;
  symbol: string;
  valuePerItem: string;
  extraSymbol?: string;
  confirmations: number;
}

export const paymentMethods: Omit<IPaymentMethod, 'valuePerItem'>[] = [
  { name: 'Bitcoin', icon: bitcoinIcon, symbol: 'BTC', confirmations: 1 },
  { name: 'Ethereum', icon: ethIcon, symbol: 'ETH', extraSymbol: 'ERC20', confirmations: 3 },
  { name: 'USDT', icon: usdtIcon, symbol: 'USDT', extraSymbol: 'ERC20', confirmations: 3 },
  { name: 'Litecoin', icon: liteCoinIcon, symbol: 'LTC', confirmations: 3 },
  { name: 'Solana', icon: solanaIcon, symbol: 'SOL', confirmations: 1 },
];

export const usePaymentMethods = (): IPaymentMethod[] => {
  const { data: prices } = useAssetPricesData();

  return paymentMethods.map((method) => {
    const price = prices?.find((p) => p.asset === method.symbol)?.price ?? 0;

    return {
      ...method,
      valuePerItem: price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  });
};
