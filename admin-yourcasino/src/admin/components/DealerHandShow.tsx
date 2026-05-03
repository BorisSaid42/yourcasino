import React from 'react';
import { BasePropertyProps } from 'adminjs';

export default function DealerHandShow({ record, property }: BasePropertyProps) {
  const cards = Object.keys(record.params)
    .filter(key => key.startsWith(`${property.path}.`))
    .sort((a, b) => {
      const indexA = parseInt(a.split('.')[1], 10);
      const indexB = parseInt(b.split('.')[1], 10);
      return indexA - indexB;
    })
    .map(key => record.params[key]);

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Label section */}
      <div style={{ color: 'rgb(140, 139, 144)', marginBottom: '0.5rem', fontSize: '12px' }}>Dealer Hand</div>

      {/* Cards section */}
      {cards.length > 0 ? (
        <div style={{ display: 'flex', margin: 0, gap: 18 }}>
          {cards.map((card, i) => (
            <img width={30} key={i} alt="blackjack card" src={`/cards/${card}.svg`} />
          ))}
        </div>
      ) : (
        <div>No cards</div>
      )}
    </div>
  );
}
