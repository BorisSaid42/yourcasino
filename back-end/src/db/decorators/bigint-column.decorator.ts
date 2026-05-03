import { Column, ColumnOptions } from 'typeorm';
import { BigIntTransformer } from '../transformers/bigint.transformer';

export function BigIntColumn(options: Partial<ColumnOptions> = {}) {
  return Column({
    type: 'bigint',
    transformer: BigIntTransformer,
    ...options,
  });
}
