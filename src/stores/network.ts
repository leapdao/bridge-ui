/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 from 'web3';
import { observable, computed } from 'mobx';
import Account from './account';
import getInjectedWeb3 from '../utils/getInjectedWeb3';

export default class Network {
  @observable
  private _mmNetwork: string;

  constructor(
    public readonly account: Account,
    public readonly network: string
  ) {
    if ((window as any).web3) {
      getInjectedWeb3()
        .then((web3: Web3) => web3.eth.net.getId())
        .then(mmNetwork => {
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
