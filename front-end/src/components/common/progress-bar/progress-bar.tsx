export const ProgressBar = ({
  className,
  barClassName,
  timeLeft,
  totalTime = 10,
}: {
  className?: string;
  barClassName?: string;
  timeLeft?: number;
  totalTime?: number;
}) => {
  const time = timeLeft || 0;

  const outer = `h-1 min-w-[235px] overflow-hidden rounded-[5px] bg-[#08152A] ${className ?? ''}`;
  const inner = `h-full bg-[#4EC87D] origin-left transition-all duration-100 ease-linear ${barClassName ?? ''}`;

  const widthPercentage = (time / totalTime) * 100;
  const clampedWidth = Math.max(0, Math.min(100, widthPercentage));

  return (
    <div className={outer}>
      <div style={{ width: `${clampedWidth}%` }} className={inner} />
    </div>
  );
};
