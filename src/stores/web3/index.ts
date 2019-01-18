import Web3Plasma from './plasma';
import Web3Root from './root';
import Web3Injected from './injected';

export default class Web3Store {
  constructor(
    public readonly root: Web3Root,
    public readonly plasma: Web3Plasma,
    public readonly injected: Web3Injected,
  ) {
  }
}
