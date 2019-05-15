export { range } from './range';
export { toArray } from './toArray';
export { txSuccess } from './txSuccess';
export { nftDisplayValue, NFT_COLOR_BASE, isNFT } from './nft';
export { nstDisplayValue, NST_COLOR_BASE, isNST } from './nst';

export { KNOWN_NETWORKS } from './knownNetworks';

export const shortenHex = hex =>
  hex && [hex.slice(0, 8), '...', hex.slice(hex.length - 6)].join('');

export const swapObject = (object: { [key: string]: any }) => {
  return Object.entries(object).reduce(
    (result, [key, value]) => Object.assign(result, { [value]: key }),
    {}
  );
};

export const colorFromAddr = (addr: string, s = 93, l = 80) => {
  const base = 24;
  const h = parseInt(addr.slice(base, base + 13), 16) % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};
