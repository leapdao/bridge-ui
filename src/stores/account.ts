/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-underscore-dangle */

import { observable, computed, reaction, action } from 'mobx';
import Web3Store from './web3/';
import autobind from 'autobind-decorator';

export default class Account {
  @observable
  private _address: string | null;
  @observable
  public ready = false;

  constructor(private web3: Web3Store) {
    if (this.web3.injected.ready) {
      this.init();
    } else {
      reaction(() => this.web3.injected.ready, this.init);
    }
  }

  @autobind
  @action
  private init() {
    if (this.web3.injected.available && this.web3.injected.instance) {
      this.watchAccounts().then(() => {
        this.ready = true;
      });
    } else {
      this.ready = true;
      reaction(
        () => this.web3.injected.instance,
        (_, r) => {
          r.dispose();
          this.watchAccounts();
        }
      );
    }
  }

  private watchAccounts() {
    setInterval(() => {
      this.web3.injected.instance.eth.getAccounts().then(accounts => {
        this.address = accounts[0];
      });
    }, 1000);

    return this.web3.injected.instance.eth.getAccounts().then(accounts => {
      this.address = accounts[0];
    });
  }

  public set address(address: string | null) {
    this._address = address;
  }

  @computed
  public get address() {
    return this._address;
  }
}
