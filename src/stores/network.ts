/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, computed, reaction } from 'mobx';
import autobind from 'autobind-decorator';
import { web3InjectedStore } from './web3/injected';
import { web3RootStore } from './web3/root';
import { accountStore } from './account';

export class NetworkStore {
  @observable
  private _mmNetwork: string;

  constructor() {
    if (web3InjectedStore.instance) {
      this.fetchNetwork();
    } else {
      reaction(() => web3InjectedStore.instance, this.fetchNetwork);
    }
  }

  @autobind
  private fetchNetwork() {
    web3InjectedStore.instance.eth.net.getId().then(mmNetwork => {
      this._mmNetwork = String(mmNetwork);
    });
  }

  @computed
  public get mmNetwork() {
    return this._mmNetwork;
  }

  protected isSameNetwork(root, mm) {
    return (
      String(root) === this.mmNetwork ||
      (root === 5777 && Number(this.mmNetwork) > 1000000)
    ); // workaround for random network id for ganache
  }

  @computed
  public get canSubmit() {
    return (
      (!!(window as any).web3 || !!(window as any).ethereum) &&
      !!accountStore.address &&
      web3RootStore &&
      this.isSameNetwork(web3RootStore.networkId, this.mmNetwork)
    );
  }

  @computed
  public get wrongNetwork() {
    return (
      this.mmNetwork &&
      web3RootStore &&
      !this.isSameNetwork(web3RootStore.networkId, this.mmNetwork)
    );
  }
}

export const networkStore = new NetworkStore();
