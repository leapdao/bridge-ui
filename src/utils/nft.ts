import { BigIntType } from 'jsbi-utils';

export const NFT_COLOR_BASE = 32769; // 2^15 + 1

export const isNFT = (color: Number): boolean => color >= NFT_COLOR_BASE;

export const nftDisplayValue = (value: BigIntType): string => value.toString(10);