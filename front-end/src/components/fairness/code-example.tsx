export function CodeExample() {
  return (
    <div className="scrollbar-thin scrollbar-thumb-[#3f3f3f] scrollbar-track-[#1e1e1e] hover:scrollbar-thumb-[#5a5a5a] max-w-full overflow-auto border border-[#2d2d2d] bg-[#1e1e1e] p-4 font-mono text-sm text-white max-md:text-xs">
      <pre className="leading-snug whitespace-pre">
        <code>
          <span className="text-[#9cdcfe]">import</span> {'{ createHash }'} <span className="text-[#c586c0]">from</span>{' '}
          <span className="text-[#ce9178]">"crypto"</span>;{'\n\n'}
          <span className="text-[#6a9955]">// Inputs from completed game</span>
          {'\n'}
          <span className="text-[#569cd6]">const</span> <span className="text-[#9cdcfe]">serverSeed</span> ={' '}
          <span className="text-[#ce9178]">"128_CHAR_SERVER_SEED"</span>;{'\n'}
          <span className="text-[#569cd6]">const</span> <span className="text-[#9cdcfe]">randomOrgString</span> ={' '}
          <span className="text-[#ce9178]">"128_CHAR_RANDOM_ORG_STRING"</span>;{'\n\n'}
          <span className="text-[#6a9955]">// Combine and hash</span>
          {'\n'}
          <span className="text-[#569cd6]">const</span> <span className="text-[#9cdcfe]">combinedHash</span> =
          createHash(
          <span className="text-[#ce9178]">"sha256"</span>){'\n'}
          {'  '}.update(<span className="text-[#ce9178]">{`\`\${serverSeed}:\${randomOrgString}\``}</span>){'\n'}
          {'  '}.digest(<span className="text-[#ce9178]">"hex"</span>);{'\n\n'}
          <span className="text-[#6a9955]">// Roulette: Generate number 0-36</span>
          {'\n'}
          <span className="text-[#569cd6]">const</span> <span className="text-[#9cdcfe]">rouletteResult</span> ={' '}
          parseInt(combinedHash.slice(<span className="text-[#b5cea8]">0</span>,{' '}
          <span className="text-[#b5cea8]">8</span>), <span className="text-[#b5cea8]">16</span>) %{' '}
          <span className="text-[#b5cea8]">37</span>;{'\n'}
          console.log(<span className="text-[#ce9178]">"Roulette:"</span>, rouletteResult);{'\n\n'}
          <span className="text-[#6a9955]">// Blackjack: Shuffle deck using hash</span>
          {'\n'}
          <span className="text-[#569cd6]">const</span> <span className="text-[#9cdcfe]">deck</span> = [
          <span className="text-[#ce9178]">"2H"</span>, <span className="text-[#ce9178]">"3H"</span>,{' '}
          <span className="text-[#6a9955]">/* ... 52 cards */</span>];{'\n'}
          <span className="text-[#c586c0]">for</span> (<span className="text-[#569cd6]">let</span>{' '}
          <span className="text-[#9cdcfe]">i</span> = deck.length - <span className="text-[#b5cea8]">1</span>; i {'>'}
          <span className="text-[#b5cea8]"> 0</span>; i--) {'{'}
          {'\n'}
          {'  '}
          <span className="text-[#569cd6]">const</span> <span className="text-[#9cdcfe]">positionHash</span> =
          createHash(
          <span className="text-[#ce9178]">"sha256"</span>){'\n'}
          {'    '}.update(<span className="text-[#ce9178]">{`\`\${combinedHash}:\${i}\``}</span>){'\n'}
          {'    '}.digest(<span className="text-[#ce9178]">"hex"</span>);{'\n'}
          {'  '}
          <span className="text-[#569cd6]">const</span> <span className="text-[#9cdcfe]">randomValue</span> ={' '}
          parseInt(positionHash.substring(<span className="text-[#b5cea8]">0</span>,{' '}
          <span className="text-[#b5cea8]">8</span>), <span className="text-[#b5cea8]">16</span>);{'\n'}
          {'  '}
          <span className="text-[#569cd6]">const</span> <span className="text-[#9cdcfe]">j</span> = randomValue % (i +{' '}
          <span className="text-[#b5cea8]">1</span>);{'\n'}
          {'  '}[deck[i], deck[j]] = [deck[j], deck[i]];{'\n'}
          {'}'}
          {'\n'}
          console.log(<span className="text-[#ce9178]">"Shuffled Deck:"</span>, deck);
        </code>
      </pre>
    </div>
  );
}
