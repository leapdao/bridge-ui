/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, autorun, computed, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { Contract } from 'web3/types';
import getWeb3 from '../utils/getWeb3';
import { token as tokenAbi } from '../utils/abis';

import Account from './account';

const tokenInfo = (token: Contract): Promise<[string, string, string]> => {
  return Promise.all([
    token.methods.symbol().call(),
    token.methods.decimals().call(),
    token.methods.name().call(),
  ]);
};

export default class Token {
  @observable public tokens: IObservableArray<Token>;

  private account: Account;
  private contract: Contract;

  public address: string;
  public color: number;
  @observable public name: string;
  @observable public symbol: string;
  @observable public decimals: number;
  @observable public balance?: number;

  constructor(account: Account, address: string, color: number) {
    this.account = account;
    this.address = address;
    this.color = color;

    const web3 = getWeb3() as Web3;
    this.contract = new web3.eth.Contract(tokenAbi, this.address);

    autorun(this.loadBalance);
    tokenInfo(this.contract).then(this.setInfo);

    if ((window as any).web3) {
      // ToDo: events are not working with web3 1.0 for some reason. Need to fix
      const iWeb3 = (window as any).web3;
      const iContract = iWeb3.eth.contract(tokenAbi).at(this.address);
      const transferEvents = iContract.Transfer({
        toBlock: 'latest',
      } as any);
      transferEvents.watch((err, event) => {
        if (
          event.args.to === this.account.address ||
          event.args.from === this.account.address
        ) {
          this.loadBalance();
        }
      });
    }
  }

  @computed
  public get decimalsBalance() {
    return (
      this.balance &&
      Number(new BigNumber(this.balance).div(10 ** this.decimals))
    );
  }

  @computed
  public get balanceString() {
    if (this.balance && this.ready) {
      return `${this.decimalsBalance} ${this.symbol}`;
    }

    return null;
  }

  @computed
  public get ready() {
    return !!this.symbol;
  }

  @autobind
  @action
  private setInfo([symbol, decimals, name]: [string, string, string]) {
    this.name = name;
    this.symbol = symbol;
    this.decimals = Number(decimals);
  }

  @autobind
  @action
  private updateBalance(balance: number) {
    this.balance = balance;
  }

  @autobind
  private loadBalance() {
    this.contract.methods
      .balanceOf(this.account.address)
      .call()
      .then(this.updateBalance);
  }
}
