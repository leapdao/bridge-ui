/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, autorun, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import Web3 from 'web3';
import getWeb3 from '../utils/getWeb3';
import { bridge as bridgeAbi } from '../utils/abis';
import { range } from '../utils';

import Account from './account';
import Token from './token';

export default class Tokens {
  @observable public tokens: IObservableArray<Token>;

  private account: Account;
  private bridgeAddr: string;

  constructor(account: Account, bridgeAddr: string) {
    this.account = account;
    this.bridgeAddr = bridgeAddr;

    this.loadTokens();
  }

  @autobind
  @action
  private updateTokens(tokens: Array<Token>) {
    this.tokens = observable.array(tokens);
  }

  public loadTokens() {
    const web3 = getWeb3() as Web3;
    const bridge = new web3.eth.Contract(bridgeAbi, this.bridgeAddr);
    return bridge.methods
      .tokenCount()
      .call()
      .then((tokenCount: number) =>
        Promise.all(
          (range(0, tokenCount - 1) as number[]).map(pos =>
            bridge.methods
              .tokens(pos)
              .call()
              .then(({ 0: address }) => new Token(this.account, address, pos))
          )
        )
      )
      .then(this.updateTokens);
  }
}
