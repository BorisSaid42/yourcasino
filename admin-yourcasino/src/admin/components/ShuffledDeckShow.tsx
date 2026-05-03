import React from 'react';
import { BasePropertyProps } from 'adminjs';

export default function ShuffledDeckShow({ record, property }: BasePropertyProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Label */}
      <div style={{ color: 'rgb(140, 139, 144)', marginBottom: '0.5rem', fontSize: '12px' }}>Shuffled Deck</div>

      {/* Deck cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {record.params?.shuffledDeck?.map((card, i) => (
          <img key={i} width={30} height={45} alt={card} src={`/cards/${card}.svg`} />
        ))}
      </div>
    </div>
  );
}
