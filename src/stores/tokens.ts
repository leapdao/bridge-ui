/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, computed, reaction, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';

import { range } from '../utils';
import Account from './account';
import Token from './token';
import Bridge from './bridge';
import Transactions from '../components/txNotification/transactions';

export default class Tokens {
  @observable public list: IObservableArray<Token>;

  private account: Account;
  private bridge: Bridge;
  private txs: Transactions;

  constructor(account: Account, bridge: Bridge, txs: Transactions) {
    this.account = account;
    this.bridge = bridge;
    this.txs = txs;

    reaction(() => this.bridge.contract, this.init);
    reaction(() => this.bridge.events, () => {
      this.bridge.events.on('NewToken', this.loadTokens.bind(this));
    });
  }

  @autobind
  private init() {
    this.loadTokens();
  }

  @autobind
  @action
  private addTokens(tokens: Array<Token>) {
    if (!this.list) {
      this.list = observable.array([]);
    }
    tokens.forEach(token => {
      this.list.push(token);
    });
  }

  @computed
  public get ready() {    
    if (!this.list) {
      return false;
    }
    return !this.list.some(token => !token.ready);
  }

  public loadTokens() {
    return this.bridge.contract.methods
      .tokenCount()
      .call()
      .then((tokenCount: number) =>
        Promise.all(
          (range(
            this.list ? this.list.length : 0,
            tokenCount - 1
          ) as number[]).map(pos =>
            this.bridge.contract.methods
              .tokens(pos)
              .call()
              .then(({ 0: address }) => new Token(this.account, this.txs, address, pos))
          )
        )
      )
      .then(this.addTokens);
  }
}
