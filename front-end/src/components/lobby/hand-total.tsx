import { useEffect, useState } from 'react';

interface IHandTotalProps {
  totalValue: number;
  handIndex: number;
  handsLength: number;
  cardsInHandLength: number;
  style?: React.CSSProperties;
}

export const HandTotal = ({ totalValue, handIndex, handsLength, cardsInHandLength, style }: IHandTotalProps) => {
  const [handTotal, setHandTotal] = useState(0);

  useEffect(() => {
    if (!totalValue) {
      setHandTotal(0);
    }

    setTimeout(() => {
      setHandTotal(totalValue);
    }, 800);
  }, [cardsInHandLength, totalValue]);

  return (
    <>
      {handTotal > 0 && (
        <div
          className="absolute z-50 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[5px] border border-[#253C60] bg-[#08152A] text-[16px] font-bold max-sm:scale-170"
          style={{
            top: `-90px`,
            left: `${(handsLength === 2 ? -30 : 35) + handIndex * 115}px`,
            ...style,
          }}
        >
          {handTotal}
        </div>
      )}
    </>
  );
};
