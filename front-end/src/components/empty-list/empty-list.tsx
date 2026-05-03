import emtpyListBackground from '../../assets/icons/lobby/empty-list-background.svg';

interface IEmptyListProps {
  text?: string | undefined;
}

export const EmptyList = ({ text = 'NO RESULTS' }: IEmptyListProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-[#152947] py-12">
      <img src={emtpyListBackground} alt="" />
      <span className="text-2xl font-extrabold text-[#465B7C]">{text}</span>
    </div>
  );
};
