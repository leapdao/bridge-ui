/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, reaction, computed, autorun, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import BigNumber from 'bignumber.js';
import { Contract, EventLog } from 'web3/types';
import { token as tokenAbi } from '../utils/abis';
import { txSuccess } from '../utils';

import Account from './account';
import ContractStore from './contractStore';
import Transactions from '../components/txNotification/transactions';
import { InflightTxReceipt } from '../utils/types';

const tokenInfo = (token: Contract): Promise<[string, string, string]> => {
  return Promise.all([
    token.methods.symbol().call(),
    token.methods.decimals().call(),
    token.methods.name().call(),
  ]);
};

const isOurTransfer = (event: EventLog, ourAccount: Account) : boolean => {
  return event.returnValues.to.toLowerCase() === ourAccount.address.toLowerCase() ||
         event.returnValues.from.toLowerCase() === ourAccount.address.toLowerCase();
};

export default class Token extends ContractStore {
  @observable public tokens: IObservableArray<Token>;

  private account: Account;

  public color: number;
  @observable public name: string;
  @observable public symbol: string;
  @observable public decimals: number;
  @observable public balance?: number;

  constructor(account: Account, transactions: Transactions, address: string, color: number) {
    super(tokenAbi, address, transactions);

    this.account = account;
    this.color = color;

    autorun(() => {
      this.loadBalance();
      tokenInfo(this.contract).then(this.setInfo);

      this.events.on('Transfer', (event: EventLog) => {
        if (isOurTransfer(event, this.account)) {
          this.loadBalance();
        }
      });
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

  public approveAndCall(
    to: string,
    value: BigNumber,
    data: string
  ): Promise<InflightTxReceipt> {
    if (!this.iContract) {
      throw new Error('No metamask');
    }

    return this.maybeApprove(to, value).then(() => {
      const futureReceipt = this.iWeb3.eth.sendTransaction({
        from: this.account.address,
        to,
        data,
      });
      return { futureReceipt }; // wrapping, otherwise PromiEvent will be returned upstream only when resolved
    });
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

  /*
  * Checks transfer allowance for a given spender. If allowance is not enough to transfer a given value,
  * initiates an approval transaction for 2^256 units. Approving maximum possible amount to make `approve` tx 
  * one time only — subsequent calls won't requre approve anymore.
  * @param spender Account to approve transfer for
  * @param value Minimal amount of allowance a spender should have
  * @returns Promise resolved when allowance is enough for the transfer
  */
  private maybeApprove(spender: string, value: BigNumber) {
    return this.iContract.methods
      .allowance(this.account.address, spender)
      .call()
      .then(allowance => {
        if (Number(allowance) >= value.toNumber()) return;

        const tx = this.iContract.methods
          .approve(spender, new BigNumber(2 ** 255))
          .send({ from: this.account.address });

        this.watchTx(tx, 'approve', {
          message: 'Approve bridge to transfer PSC',
          description: 'Before you process with your tx, you need to sign a ' +
                        'transaction to allow the bridge contract to transfer your PSC.',
        });

        return txSuccess(tx);
      });
  }
}
