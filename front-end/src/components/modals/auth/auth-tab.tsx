export const AuthTabButton = ({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`cursor-pointer pb-5 font-[900] text-[#6E88AF] max-sm:text-base ${isActive ? 'active-auth-btn' : ''}`}
  >
    {label}
  </div>
);
