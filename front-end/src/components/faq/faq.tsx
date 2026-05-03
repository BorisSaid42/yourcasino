import { DocumentationNavigator } from '../documentation-navigator/documentation-navigator';

const FAQ_DATA = [
  {
    question: 'What is YourCasino?',
    answer:
      'YourCasino is an online platform where players can create and host their own casino tables. You set the rules, choose the stakes, and let others join to place bets and play against you.',
  },
  {
    question: 'How do I create my own table?',
    answer:
      'YourCasino lets you host private or public tables in just a few clicks. Set your own table limits, customize your rules, and invite friends or open it up to the public. Simply deposit and select “Create Lobby.”',
  },
  {
    question: 'What games can I host on YourCasino?',
    answer:
      'YourCasino currently supports Blackjack & Roulette. Players hosting lobbies can choose which game to offer, with flexible betting ranges to fit their style. More games are coming soon.',
  },
  {
    question: 'How are winnings paid out?',
    answer:
      'Winnings are instantly credited to your YourCasino wallet once a game concludes. From there, you can withdraw, use the balance to join other games, or create your own tables.',
  },
  {
    question: 'Are games on YourCasino fair?',
    answer:
      'Yes. All games are run on provably fair systems, meaning results are verifiable and cannot be manipulated. This ensures both players and hosts have full transparency and trust in every bet placed.',
  },
  {
    question: 'Can I play without hosting a table?',
    answer:
      'Yes, you can join any hosted table without running one yourself. Browse the lobby, filter by table stakes and game type, and jump into games based on your preferences. Or, ask a friend to create a lobby and play against them!',
  },
  {
    question: 'Can I limit who joins my table?',
    answer:
      'Yes, as a host you can set your table to private or public. This way, only your invited friends or approved players can join, while public tables remain open for anyone to enter.',
  },
  {
    question: 'Is YourCasino available worldwide?',
    answer:
      'YourCasino can be accessed from most regions, but some countries may have restrictions due to local laws. Check our Terms of Service to confirm if you’re eligible to play or host.',
  },
];

export const FAQ = () => {
  return (
    <div className="flex h-full w-full justify-center px-6">
      <div className="flex w-full max-w-[1200px] flex-col py-12">
        <DocumentationNavigator />
        <div className="my-8">
          <span className="text-2xl font-extrabold">Frequently Asked Questions</span>
          {FAQ_DATA.map((faqItem, idx) => (
            <div className="mt-6 flex flex-col" key={`faq-item-${idx}`}>
              <span className="border-l-4 border-[#4486DD] pb-2 pl-3 text-base font-extrabold text-[#4486DD]">
                {faqItem.question}
              </span>
              <span className="pl-4 text-base font-medium text-[#658DC9]">{faqItem.answer}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
