/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, autorun, computed, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import BigNumber from 'bignumber.js';
import { Contract, EventLog } from 'web3/types';
import { token as tokenAbi } from '../utils/abis';

import Account from './account';
import ContractStore from './contractStore';

const tokenInfo = (token: Contract): Promise<[string, string, string]> => {
  return Promise.all([
    token.methods.symbol().call(),
    token.methods.decimals().call(),
    token.methods.name().call(),
  ]);
};

export default class Token extends ContractStore {
  @observable public tokens: IObservableArray<Token>;

  private account: Account;

  public color: number;
  @observable public name: string;
  @observable public symbol: string;
  @observable public decimals: number;
  @observable public balance?: number;

  constructor(account: Account, address: string, color: number) {
    super(tokenAbi, address);

    this.account = account;
    this.color = color;

    autorun(this.loadBalance);
    tokenInfo(this.contract).then(this.setInfo);

    this.contract.events.Transfer({}, (_, event: EventLog) => {
      if (
        event.returnValues.to.toLowerCase() === this.account.address.toLowerCase() ||
        event.returnValues.from.toLowerCase() === this.account.address.toLowerCase()
      ) {
        this.loadBalance();
      }
    });
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

  public approveAndCall(to: string, value: BigNumber, data: string) {
    if (!this.iContract) {
      throw new Error('No metamask');
    }

    const tx = this.iContract.methods
      .approveAndCall(to, value, data)
      .send({ from: this.account.address });

    tx.on('confirmation', this.loadBalance);

    return tx;
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
