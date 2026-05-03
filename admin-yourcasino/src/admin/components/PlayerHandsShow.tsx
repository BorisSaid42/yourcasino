import React from 'react';
import { BasePropertyProps } from 'adminjs';

export default function PlayerHandsShow({ record, property }: BasePropertyProps) {
  const handsRaw = record.params[property.path];

  if (!handsRaw) {
    return <div>No hands</div>;
  }

  const hands = handsRaw.split('|').map(hand =>
    hand
      .trim()
      .split(',')
      .map(card => card.trim()),
  );

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ color: 'rgb(140, 139, 144)', marginBottom: '0.5rem', fontSize: '12px' }}>Player Hands</div>

      {/* Hands section */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', width: 'fit-content' }}>
        {hands.map((hand, handIndex) => (
          <div key={handIndex} style={{ display: 'flex' }}>
            {hand.map((card, cardIndex) => (
              <img
                style={{ marginLeft: '-10px' }}
                width={30}
                key={cardIndex}
                alt="blackjack card"
                src={`/cards/${card}.svg`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
