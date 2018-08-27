export const NETWORKS = {
  1: { name: 'Mainnet', provider: 'https://mainnet.infura.io' },
  3: { name: 'Ropsten', provider: 'https://ropsten.infura.io' },
  4: { name: 'Rinkeby', provider: 'wss://rinkeby.infura.io/_ws' },
  42: { name: 'Kovan', provider: 'https://kovan.infura.io' },
  4447: { name: 'Truffle', provider: 'http://localhost:9545' },
};

export const DEFAULT_NETWORK = '4';

export { range } from './range.ts';
