import { DocumentationNavigator } from '../documentation-navigator/documentation-navigator';
import { CodeExample } from './code-example';
import { FairnessForm } from './fairness-form';

export const Fairness = () => {
  return (
    <div className="flex h-full w-full justify-center px-6">
      <div className="flex w-full max-w-[1200px] flex-col py-12">
        <DocumentationNavigator />
        <div className="my-8 flex gap-12 max-md:flex-col-reverse">
          <div className="flex w-full max-w-[357px] flex-col gap-8">
            <FairnessForm />
            <CodeExample />
          </div>
          <div className="flex flex-col gap-9">
            <div className="flex flex-col">
              <span className="mb-3 text-2xl font-extrabold">Fairness</span>
              <span className="text-base font-medium text-[#658DC9]">
                Our website uses the Provably Fair algorithm to ensure verifiability, transparency, and equal randomness
                for all users. We prioritize honesty, fairness, and guarantee the integrity of our system. The Provably
                Fair algorithm relies on two main parameters: Server Seed and Random.org String. Results are determined
                at the moment the game starts. You will receive an encrypted hash of the server seed before the game
                begins, and the initial and final hash values will match, proving our website's non-interference with
                the results.
              </span>
            </div>
            <div className="flex flex-col">
              <span className="mb-3 text-2xl font-extrabold">How it works</span>
              <span className="text-base font-medium text-[#658DC9]">
                When a game is created, we generate a Server Seed (a 64-character random string). This server seed is
                then hashed into SHA256 and publicly displayed in the game for verification. When the game starts, we
                fetch a Random.org String (a 128-character cryptographically secure random string from Random.org API).
                The server seed and random.org string are combined with a colon and hashed using SHA256. This combined
                hash is then used to generate the game results, as shown in the code example below. For Blackjack, the
                hash shuffles the deck. For Roulette, the hash generates a number from 0 to 36.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
