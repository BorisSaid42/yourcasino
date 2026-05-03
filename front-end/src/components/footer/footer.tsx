import { Link, useLocation } from '@tanstack/react-router';
import logo from '../../assets/your-casino-logo.svg';
import twitterLogo from '../../assets/icons/common/twitter-logo.svg';
import discordLogo from '../../assets/icons/common/discord-logo.svg';
import telegramLogo from '../../assets/icons/common/telegram-logo.svg';

export const Footer = () => {
  const location = useLocation();

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="mt-auto flex min-h-[126px] w-full justify-center bg-[#152947]">
        <div className="flex w-full max-w-[1200px] items-center justify-between gap-6 p-6 py-14 max-md:flex-col">
          {location.pathname === '/maintenance' ? (
            <img className="w-[208px]" src={logo} alt="YOURCASINO" />
          ) : (
            <Link to="/">
              <img className="w-[208px]" src={logo} alt="YOURCASINO" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <a
              className="hover-base flex h-10 w-12 items-center justify-center rounded-[5px] bg-[#182E51]"
              href="https://x.com/realyourcasino?s=21"
              target="_blank"
            >
              <img src={twitterLogo} />
            </a>
            <a
              className="hover-base flex h-10 w-12 items-center justify-center rounded-[5px] bg-[#182E51]"
              href="https://discord.gg/u7JPcbgZ28"
              target="_blank"
            >
              <img src={discordLogo} />
            </a>
            <a
              className="hover-base flex h-10 w-12 items-center justify-center rounded-[5px] bg-[#182E51]"
              href="https://t.me/yourcasino"
              target="_blank"
            >
              <img src={telegramLogo} />
            </a>
          </div>
        </div>
      </div>
      <div className="mt-auto flex min-h-[66px] w-full justify-center bg-[#152947] px-96 text-center text-[#658DC9] max-xl:px-10">
        <p>
          Welcome to YourCasino — the first peer-to-peer crypto platform where you can become the casino. Host or join
          100% fair games like Blackjack and Roulette with instant crypto deposits and withdrawals. Share your lobby
          with friends, make your rules as the house, and experience the future of online gaming.
        </p>
      </div>
      <div className="mt-auto flex min-h-[56px] w-full justify-center bg-[#152947] px-96 text-center text-[#658DC9] max-xl:px-10">
        <p>
          Yourcasino is owned and operated by Action Play Ltd. located at 2ⁿᵈ Floor, O’Neal Marketing Associates
          Building, Wickham’s Cay II, P. O. Box 3174, Road Town, Tortola, British Virgin Islands, VG1110.
        </p>
      </div>
    </div>
  );
};
