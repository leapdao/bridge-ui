import { observable, action } from 'mobx';
import Web3Type from 'web3';
import Web3 from './web3_ts_workaround';

export default class Web3Store {
  @observable.ref
  public injected: Web3Type | null = null;

  @observable
  public injectedAvailable = false;

  @observable
  public approved = false;

  @observable
  public ready = false;

  constructor() {
    const { ethereum, web3 } = window as any;
    const metamask = ethereum && ethereum._metamask; // eslint-disable-line no-underscore-dangle

    this.injectedAvailable = !!(ethereum || web3);
    if (metamask) {
      metamask.isApproved().then(approved => {
        this.updateInjected(approved ? ethereum : null, approved);
      });
    } else if (web3) {
      this.updateInjected(web3.currentProvider);
    }
  }

  @action
  private updateInjected(provider, approved = true) {
    this.ready = true;
    this.approved = approved;
    if (provider) {
      this.injected = new Web3(provider);
    }
  }

  public enable() {
    const { ethereum } = window as any;
    const metamask = ethereum && ethereum._metamask; // eslint-disable-line no-underscore-dangle

    if (!metamask) {
      throw new Error('Only for EIP-1102 compilant metamask');
    }

    ethereum
      .enable()
      .then(() => {
        this.injected = new Web3(ethereum);
        this.approved = true;
      })
      .catch(() => {});
  }
}
