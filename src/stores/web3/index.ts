import { web3PlasmaStore } from './plasma';
import { web3RootStore } from './root';
import { web3InjectedStore } from './injected';

export class Web3Store {
  public readonly root = web3RootStore;
  public readonly plasma = web3PlasmaStore;
  public readonly injected = web3InjectedStore;
}

export const web3Store = new Web3Store();
