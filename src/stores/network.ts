import { observable, computed } from 'mobx';
import Web3 from 'web3';
import Account from './account';
import getWeb3 from '../utils/getWeb3';

export default class Network {
  @observable private _mmNetwork: string;

  constructor(
    public readonly account: Account,
    public readonly network: string
  ) {
    if ((window as any).web3) {
      const web3 = getWeb3(true) as Web3;
      web3.eth.net.getId().then(mmNetwork => {
        this._mmNetwork = String(mmNetwork);
      });
    }
  }

  @computed
  public get mmNetwork() {
    return this._mmNetwork;
  }

  @computed
  public get canSubmit() {
    return (
      !!(window as any).web3 &&
      !!this.account.address &&
      this.network === this.mmNetwork
    );
  }
}
