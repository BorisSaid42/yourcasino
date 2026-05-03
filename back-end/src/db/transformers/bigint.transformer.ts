export const BigIntTransformer = {
  to: (value: bigint | null): string | null | undefined => {
    if (typeof value === 'bigint') return value.toString();
    if (value === null) return null;
    return undefined;
  },
  from: (value: string | null): bigint | null => {
    return typeof value === 'string' ? BigInt(value) : null;
  },
};
