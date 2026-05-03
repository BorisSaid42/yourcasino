import { classNames } from '../../../lib/utils';
import { CopyButton } from '../buttons/copy-button';

interface IInviteToLobbyInputProps {
  inviteLink: string;
  className?: string;
  inputClassName?: string;
}

export const InviteToLobbyInput = ({ inviteLink, className = '', inputClassName = '' }: IInviteToLobbyInputProps) => {
  return (
    <div
      className={classNames(
        'flex w-full max-w-[352px] items-center rounded-[5px] border border-[#253C60] bg-[#08152A] p-2.5 pl-5 max-md:max-w-[150px]',
        className,
      )}
    >
      <input
        disabled
        type="text"
        value={inviteLink}
        className={classNames('w-full text-sm font-semibold', inputClassName)}
      />
      <CopyButton copyLink={`${inviteLink}/roulette`} />
    </div>
  );
};
