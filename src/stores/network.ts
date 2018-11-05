/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, computed, reaction } from 'mobx';
import Account from './account';
import Web3Store from './web3';
import autobind from 'autobind-decorator';

export default class Network {
  @observable
  private _mmNetwork: string;

  constructor(
    private readonly account: Account,
    private readonly web3: Web3Store,
    public readonly network: string
  ) {
    if (this.web3.injected) {
      this.fetchNetwork();
    } else {
      reaction(() => this.web3.injected, this.fetchNetwork);
    }
  }

  @autobind
  private fetchNetwork() {
    this.web3.injected.eth.net.getId().then(mmNetwork => {
      this._mmNetwork = String(mmNetwork);
    });
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
