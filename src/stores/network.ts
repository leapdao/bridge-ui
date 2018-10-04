/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 = require('web3'); // weird imports for strange typings
import { observable, computed } from 'mobx';
import Account from './account';
import getWeb3 from '../utils/getWeb3';

export default class Network {
  @observable
  private _mmNetwork: string;

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
