/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-underscore-dangle */

import { observable, computed } from 'mobx';

export default class Account {
  @observable private _address: string;

  constructor(address: string) {
    this._address = address;
  }

  set address(address) {
    this._address = address;
  }

  @computed
  get address() {
    return this._address;
  }
}
