import { DocumentationNavigator } from '../documentation-navigator/documentation-navigator';

export const TOS = () => {
  return (
    <div className="flex h-full w-full justify-center px-6">
      <div className="flex w-full max-w-[1200px] flex-col py-12">
        <DocumentationNavigator />
        <div className="my-8">
          <span className="text-2xl font-extrabold">Terms of Service</span>
          <div className="mt-6 text-base font-medium text-[#658DC9]">
            <h1 className="text-xl font-bold text-white">1. Introduction</h1>
            <p>
              Welcome to YourCasino (the “Platform”), operated by Action Play Ltd., a company incorporated under the
              laws of the British Virgin Islands. By accessing or using our website, products, services, or features
              (collectively, the “Services”), you agree to these Terms of Service (“Terms”). If you do not agree, you
              must not use the Services. You represent that you are at least 18 years old (or the legal age of majority
              in your jurisdiction) and legally permitted to participate in online gaming and crypto transactions. You
              are solely responsible for ensuring that your use of the Platform complies with all applicable laws in
              your jurisdiction.
            </p>
            <br />
            <h1 className="text-xl font-bold text-white">2. Description of Services</h1>
            <p>
              YourCasino is a peer-to-peer crypto gaming platform. Users can create and join private game lobbies (e.g.,
              Blackjack, Roulette) and play against each other using supported cryptocurrencies. YourCasino does not act
              as the house; instead, users host games and set their own terms. We provide the technological
              infrastructure for users to interact and settle peer-to-peer wagers using blockchain transactions. We are
              not a financial institution and do not provide investment advice or guarantee winnings. All use of the
              Platform is at your own risk.
            </p>
            <br />
            <h1 className="text-xl font-bold text-white">3. Jurisdiction & Restrictions</h1>
            <p>
              YourCasino is operated from the British Virgin Islands. We make no representation that the Services are
              appropriate or legal in every jurisdiction. You must not access or use the Services if you are located in
              a restricted territory, including but not limited to the United States, the United Kingdom, or any country
              subject to OFAC sanctions or where online gambling is prohibited. You are solely responsible for
              determining whether online peer-to-peer crypto gaming is legal in your location. We reserve the right to
              block or terminate access to any user from a restricted jurisdiction.
            </p>
            <br />
            <h1 className="text-xl font-bold text-white">4. Crypto Use & Risk</h1>
            <p>
              Transactions on YourCasino use blockchain technology. By using the Platform, you acknowledge and accept
              the inherent risks of cryptocurrency transactions, including volatility, network fees, wallet
              mismanagement, or irreversible transactions. You are fully responsible for securing your wallet
              credentials and private keys. We may require basic KYC / AML checks or block access if suspicious activity
              is detected. You agree not to use the Platform for unlawful purposes, including money laundering or
              terrorist financing.
            </p>
            <br />
            <h1 className="text-xl font-bold text-white">5. Intellectual Property</h1>
            <p>
              All content, branding, and software on the Platform are the property of Action Play Ltd. or its licensors.
              You may use the Services only for lawful, personal, non-commercial purposes. You may not copy, distribute,
              modify, or exploit the Platform or its content without our prior written consent.
            </p>
            <br />
            <h1 className="text-xl font-bold text-white">6. User Conduct</h1>
            <p>You agree not to:</p>
            <ul>
              <li>● Use the Platform if you are underage or in a restricted jurisdiction.</li>
              <li>● Interfere with, disrupt, or manipulate game outcomes or the security of the Platform.</li>
              <li>● Create multiple accounts to exploit bonuses or system features.</li>
              <li>
                ● Engage in fraud, collusion, or any unlawful activity. We reserve the right to suspend or terminate
                your access if you violate these Terms.
              </li>
            </ul>
            <br />
            <h1 className="text-xl font-bold text-white">7. Disclaimers & Limitation of Liability</h1>
            <p>
              The Services are provided “as is” without warranties of any kind, express or implied. We do not guarantee
              uninterrupted service, the legality of use in your jurisdiction, or any specific outcome of games. To the
              maximum extent permitted by law, Action Play Ltd. and its affiliates shall not be liable for any indirect,
              incidental, special, consequential, or exemplary damages, including lost winnings, arising from your use
              of the Platform. Your sole remedy for dissatisfaction with the Services is to stop using them.
            </p>
            <br />
            <h1 className="text-xl font-bold text-white">8. Governing Law & Disputes</h1>
            <p>
              These Terms are governed by the laws of the British Virgin Islands. Any dispute shall be resolved
              exclusively by the competent courts of the British Virgin Islands, unless otherwise required by applicable
              law.
            </p>
            <br />
            <h1 className="text-xl font-bold text-white">9. Changes to Terms</h1>
            <p>
              We may update these Terms from time to time. Changes will be effective upon posting. Continued use of the
              Services after an update constitutes acceptance of the new Terms.
            </p>
            <br />
            <h1 className="text-xl font-bold text-white"> 10. Contact</h1>
            <p>
              For questions or complaints, contact us at: 📩{' '}
              <a href="mailto:admin@yourcasino.com" className="text-white underline hover:text-[#658DC9]">
                admin@yourcasino.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
