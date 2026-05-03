import { IPaymentMethod, usePaymentMethods } from '../../../lib/payment-methods';

export interface IDepositModalOptionsProps {
  handleDepositMethod: (method: IPaymentMethod) => void;
}

export const DepositModalOptions = ({ handleDepositMethod }: IDepositModalOptionsProps) => {
  const paymentMethods = usePaymentMethods();
  return (
    <div className="flex w-full flex-col py-6">
      <div className="text-center text-xs font-extrabold text-[#6E88AF8F]">Select your method</div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-b border-[#12223B] px-9 pb-6 max-md:px-3.5">
        {paymentMethods.map((paymentMethod, idx) => (
          <div
            className="flex cursor-pointer items-center gap-3 rounded-[5px] border-2 border-transparent bg-[#253C60] p-4 transition-colors duration-200 hover:border-yellow-400"
            key={`deposit-method-${idx}`}
            onClick={() => handleDepositMethod(paymentMethod)}
          >
            <img className="max-sm:h-8 max-sm:w-8" src={paymentMethod.icon} />
            <div className="flex flex-col">
              <div className="flex items-center gap-[5px] text-base font-extrabold text-white">
                {paymentMethod.name}
                {paymentMethod.extraSymbol && (
                  <span className="flex min-h-[18px] items-center rounded-[5px] border border-[#253C60] bg-[#3B557D] px-[5px] text-xs font-extrabold">
                    {paymentMethod.extraSymbol}
                  </span>
                )}
              </div>
              <div className="flex items-center text-sm font-bold text-[#6D8AB7]">~ ${paymentMethod.valuePerItem}</div>
            </div>
          </div>
        ))}
        {paymentMethods.length % 2 !== 0 ? <div className="flex rounded-[5px] bg-[#253C601F]"></div> : null}
      </div>
      <div className="mt-6 w-full text-center text-xs font-bold text-[#6E88AF8F]">
        All deposits will be converted to USD value.
      </div>
    </div>
  );
};
