import React from 'react';
import { BasePropertyProps } from 'adminjs';

export default function DealerHandList({ record, property }: BasePropertyProps) {
  const cards = Object.keys(record.params)
    .filter(key => key.startsWith(`${property.path}.`))
    .sort((a, b) => {
      const indexA = parseInt(a.split('.')[1], 10);
      const indexB = parseInt(b.split('.')[1], 10);
      return indexA - indexB;
    })
    .map(key => record.params[key]);

  return <span>{cards.length ? cards.join(', ') : '—'}</span>;
}
