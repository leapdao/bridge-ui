export const NFT_COLOR_BASE = 32769; // 2^15 + 1

export const isNFT = color => color >= NFT_COLOR_BASE;

export { range } from './range';
export { toArray } from './toArray';
export { txSuccess } from './txSuccess';

export const shortenHex = hex =>
  hex && [hex.slice(0, 8), '...', hex.slice(hex.length - 6)].join('');

export const swapObject = (object: { [key: string]: any }) => {
  return Object.entries(object).reduce(
    (result, [key, value]) => Object.assign(result, { [value]: key }),
    {}
  );
};
