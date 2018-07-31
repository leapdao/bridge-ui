export const NETWORKS = {
  1: { name: 'Mainnet', provider: 'https://mainnet.infura.io' },
  3: { name: 'Ropsten', provider: 'https://ropsten.infura.io' },
  4: { name: 'Rinkeby', provider: 'https://rinkeby.infura.io' },
  42: { name: 'Kovan', provider: 'https://kovan.infura.io' },
  6: { name: 'Truffle', provider: 'http://localhost:9545' },
};

export const DEFAULT_NETWORK = '4';

export { range } from './range.ts';
