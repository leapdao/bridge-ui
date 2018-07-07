export const NETWORKS = {
  1: { name: 'Mainnet', provider: 'https://mainnet.infura.io' },
  3: { name: 'Ropsten', provider: 'https://ropsten.infura.io' },
  4: { name: 'Rinkeby', provider: 'https://rinkeby.infura.io' },
  42: { name: 'Kovan', provider: 'https://kovan.infura.io' },
};

export const DEFAULT_NETWORK = '4';

export const range = (s, e) =>
  Array.from(new Array(e - s + 1), (_, i) => i + s);
