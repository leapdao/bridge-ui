/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-underscore-dangle */

import Web3 = require('web3'); // weird imports for strange typings
import { observable, computed } from 'mobx';
import getWeb3 from '../utils/getWeb3';

export default class Account {
  @observable
  private _address: string | null;
  @observable
  public ready = false;

  constructor() {
    const web3 = getWeb3(true) as Web3;
    if ((window as any).web3) {
      setInterval(() => {
        web3.eth.getAccounts().then(accounts => {
          this.address = accounts[0];
        });
      }, 1000);

      web3.eth.getAccounts().then(accounts => {
        this.address = accounts[0];
        this.ready = true;
      });
    } else {
      this.ready = true;
    }
  }

  public set address(address: string | null) {
    this._address = address;
  }

  @computed
  public get address() {
    return this._address;
  }
}
