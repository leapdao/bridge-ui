export const NETWORKS = {
  1: { name: 'Mainnet', provider: 'https://mainnet.infura.io', etherscanBase: 'https://etherscan.io' },
  3: { name: 'Ropsten', provider: 'https://ropsten.infura.io', etherscanBase: 'https://ropsten.etherscan.io' },
  4: { name: 'Rinkeby', provider: 'https://rinkeby.infura.io', etherscanBase: 'https://rinkeby.etherscan.io' },
  42: { name: 'Kovan', provider: 'https://kovan.infura.io', etherscanBase: 'https://kovan.etherscan.io' },
  4447: { name: 'Truffle', provider: 'http://localhost:9545', etherscanBase: 'https://etherscan.io' },
  5777: { name: 'Ganache', provider: 'http://localhost:7545', etherscanBase: 'https://etherscan.io' },
};

export const PLASMA_NODES = {
  0: 'http://localhost:8645',
  1: 'http://node1.testnet.leapdao.org:8645',
  2: 'http://node2.testnet.leapdao.org:8645',
  3: 'http://node3.testnet.leapdao.org:8645',
  4: 'http://node4.testnet.leapdao.org:8645',
};

export const DEFAULT_NETWORK = '4';

export const NFT_COLOR_BASE = 32769; // 2^15 + 1

export const isNFT = color => color >= NFT_COLOR_BASE;

export const DEFAULT_PLASMA_NODE = '1';

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
