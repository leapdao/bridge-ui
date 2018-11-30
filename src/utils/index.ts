export const NETWORKS = {
  1: { name: 'Mainnet', provider: 'https://mainnet.infura.io' },
  3: { name: 'Ropsten', provider: 'https://ropsten.infura.io' },
  4: { name: 'Rinkeby', provider: 'https://rinkeby.infura.io' },
  42: { name: 'Kovan', provider: 'https://kovan.infura.io' },
  4447: { name: 'Truffle', provider: 'http://localhost:9545' },
};

export const PLASMA_NODES = {
  0: 'http://localhost:8645',
  1: 'https://testnet-1.leapdao.org',
  2: 'https://testnet-2.leapdao.org',
};

export const DEFAULT_NETWORK = '4';

export const NFT_COLOR_BASE = 32769; // 2^15 + 1

export const isNFT = color => color >= NFT_COLOR_BASE;

export const DEFAULT_PLASMA_NODE = '1';

export { range } from './range';
export { txSuccess } from './txSuccess';

export const shortenHex = hex =>
  hex && [hex.slice(0, 8), '...', hex.slice(hex.length - 6)].join('');

export const swapObject = (object: { [key: string]: any }) => {
  return Object.entries(object).reduce(
    (result, [key, value]) => Object.assign(result, { [value]: key }),
    {}
  );
};
