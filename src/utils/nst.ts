import { BigIntType } from 'jsbi-utils';

export const NST_COLOR_BASE = 49153; // 2^15 + 1 + 2^14

export const isNST = (color: number): boolean => color >= NST_COLOR_BASE;

export const nstDisplayValue = (value: BigIntType): string =>
  value.toString(10);
