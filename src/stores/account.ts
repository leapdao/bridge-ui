/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-underscore-dangle */

import { observable, computed, reaction, action } from 'mobx';
import autobind from 'autobind-decorator';
import { web3InjectedStore } from './web3/injected';

export class AccountStore {
  @observable
  private _address: string | null;
  @observable
  public ready = false;

  constructor() {
    if (web3InjectedStore.ready) {
      this.init();
    } else {
      reaction(() => web3InjectedStore.ready, this.init);
    }
  }

  @autobind
  @action
  private init() {
    if (web3InjectedStore.available && web3InjectedStore.instance) {
      this.watchAccounts().then(() => {
        this.ready = true;
      });
    } else {
      this.ready = true;
      reaction(
        () => web3InjectedStore.instance,
        (_, r) => {
          r.dispose();
          this.watchAccounts();
        }
      );
    }
  }

  private watchAccounts() {
    setInterval(() => {
      web3InjectedStore.instance.eth.getAccounts().then(accounts => {
        this.address = accounts[0];
      });
    }, 1000);

    return web3InjectedStore.instance.eth.getAccounts().then(accounts => {
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

export const accountStore = new AccountStore();
