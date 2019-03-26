/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, computed, reaction } from 'mobx';
import autobind from 'autobind-decorator';

import Account from './account';
import Web3Store from './web3/';

export default class Network {
  @observable
  private _mmNetwork: string;

  constructor(
    private readonly account: Account,
    private readonly web3: Web3Store
  ) {
    if (this.web3.injected.instance) {
      this.fetchNetwork();
    } else {
      reaction(() => this.web3.injected.instance, this.fetchNetwork);
    }
  }

  @autobind
  private fetchNetwork() {
    this.web3.injected.instance.eth.net.getId().then(mmNetwork => {
      this._mmNetwork = String(mmNetwork);
    });
  }

  @computed
  public get mmNetwork() {
    return this._mmNetwork;
  }

  protected isSameNetwork(root, mm) {
    return String(root) === this.mmNetwork ||
      root === 5777 && Number(this.mmNetwork) > 1000000; // workaround for random network id for ganache
  }

  @computed
  public get canSubmit() {
    return (
      (!!(window as any).web3 || !!(window as any).ethereum) &&
      !!this.account.address && this.web3.root && 
      this.isSameNetwork(this.web3.root.networkId, this.mmNetwork)
    );
  }

  @computed
  public get wrongNetwork() {
    return this.mmNetwork && this.web3.root &&
           !this.isSameNetwork(this.web3.root.networkId, this.mmNetwork);
  }

}
