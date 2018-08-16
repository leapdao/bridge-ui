/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, autorun, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';

import { bridge as bridgeAbi } from '../utils/abis';
import { range } from '../utils';
import Account from './account';
import Token from './token';
import Bridge from './bridge';

export default class Tokens {
  @observable public list: IObservableArray<Token>;

  private account: Account;
  private bridge: Bridge;

  constructor(account: Account, bridge: Bridge) {
    this.account = account;
    this.bridge = bridge;

    this.loadTokens();

    if ((window as any).web3) {
      // ToDo: events are not working with web3 1.0 for some reason. Need to fix
      const iWeb3 = (window as any).web3;
      const iContract = iWeb3.eth.contract(bridgeAbi).at(this.bridge.address);
      const newTokenEvents = iContract.NewToken({
        toBlock: 'latest',
      } as any);
      newTokenEvents.watch((err, e) => {
        this.loadTokens();
      });
    }
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
              .then(({ 0: address }) => new Token(this.account, address, pos))
          )
        )
      )
      .then(this.addTokens);
  }
}
