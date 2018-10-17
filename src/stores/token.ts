/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import {
  observable,
  action,
  computed,
  autorun,
  IObservableArray,
  reaction,
} from 'mobx';
import autobind from 'autobind-decorator';
import BigNumber from 'bignumber.js';
import Contract from 'web3/eth/contract';
import { EventLog } from 'web3/types';
import { erc20, erc721 } from '../utils/abis';
import { txSuccess, isNFT } from '../utils';

import Account from './account';
import ContractStore from './contractStore';
import Explorer from './explorer';
import Transactions from '../components/txNotification/transactions';
import { InflightTxReceipt } from '../utils/types';

const tokenInfo = (
  token: Contract,
  color: number
): Promise<[string, string, string]> => {
  return Promise.all([
    token.methods.symbol().call(),
    isNFT(color) ? Promise.resolve(0) : token.methods.decimals().call(),
    token.methods.name().call(),
  ]);
};

const isOurTransfer = (event: EventLog, ourAccount: Account): boolean => {
  return (
    event.returnValues[0].toLowerCase() === ourAccount.address.toLowerCase() ||
    event.returnValues[1].toLowerCase() === ourAccount.address.toLowerCase()
  );
};

export default class Token extends ContractStore {
  @observable
  public tokens: IObservableArray<Token>;

  private account: Account;

  public color: number;

  @observable
  public name: string;
  @observable
  public symbol: string;
  @observable
  public decimals: number;
  @observable
  public balance?: number;
  @observable
  public plasmaBalance?: number;

  constructor(
    account: Account,
    transactions: Transactions,
    address: string,
    color: number,
    private explorer: Explorer
  ) {
    super(isNFT(color) ? erc721 : erc20, address, transactions);

    this.account = account;
    this.color = color;

    autorun(this.loadBalance);
    autorun(this.loadPlasmaBalance);
    tokenInfo(this.contract, color).then(this.setInfo);

    if (this.events) {
      this.events.on('Transfer', (event: EventLog) => {
        if (isOurTransfer(event, this.account)) {
          this.loadBalance();
        }
      });
    }

    reaction(() => explorer.latestBlock, this.loadPlasmaBalance);
  }

  @computed
  public get decimalsBalance() {
    return this.balance && this.toTokens(this.balance);
  }

  @computed
  public get ready() {
    return !!this.symbol;
  }

  public get isNft() {
    return isNFT(this.color);
  }

  /**
   * Converts given amount of tokens to token cents according to this token decimals.
   * Returns given value unchanged if this token is NFT.
   * @param tokenValue Amount of tokens to convert to token cents or token Id for NFT token
   */
  public toCents(tokenValue: number): number {
    if (this.isNft) return tokenValue;

    return new BigNumber(tokenValue).mul(10 ** this.decimals).toNumber();
  }

  /**
   * Converts given amount of token cents to the whole token according to this token decimals.
   * Returns given value unchanged if this token is NFT.
   * @param tokenValue Amount of token cents to convert to tokens or token Id for NFT token
   */
  public toTokens(tokenCentsValue: number): number {
    if (this.isNft) return tokenCentsValue;

    return new BigNumber(tokenCentsValue).div(10 ** this.decimals).toNumber();
  }

  public approveAndCall(
    to: string,
    value: number,
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

  @autobind
  @action
  private updatePlasmaBalance(balance: number) {
    this.plasmaBalance = balance;
  }

  @autobind
  private loadPlasmaBalance() {
    this.plasmaContract.methods
      .balanceOf(this.account.address)
      .call()
      .then(this.updatePlasmaBalance);
  }

  private allowanceOrTokenId(valueOrTokenId: number) {
    if (this.isNft) return valueOrTokenId;

    return `0x${new BigNumber(2).pow(255).toString(16)}`;
  }

  private hasEnoughAllowance(spender: string, value: number): Promise<Boolean> {
    if (this.isNft) {
      return this.iContract.methods
        .getApproved(value)
        .call()
        .then(operator => operator === spender);
    } else {
      return this.iContract.methods
        .allowance(this.account.address, spender)
        .call()
        .then(allowance => Number(allowance) >= value);
    }
  }

  /*
  * Checks transfer allowance for a given spender. If allowance is not enough to transfer a given value,
  * initiates an approval transaction for 2^256 units. Approving maximum possible amount to make `approve` tx
  * one time only — subsequent calls won't requre approve anymore.
  * @param spender Account to approve transfer for
  * @param value Minimal amount of allowance a spender should have
  * @returns Promise resolved when allowance is enough for the transfer
  */
  private maybeApprove(spender: string, value: number) {
    return this.hasEnoughAllowance(spender, value).then(hasEnoughAllowance => {
      if (hasEnoughAllowance) return;

      const tx = this.iContract.methods
        .approve(spender, this.allowanceOrTokenId(value))
        .send({ from: this.account.address });

      this.watchTx(tx, 'approve', {
        message: `Approve bridge to transfer ${this.symbol}`,
        description:
          'Before you proceed with your tx, you need to sign a ' +
          `transaction to allow the bridge contract to transfer your ${
            this.symbol
          }.`,
      });

      return txSuccess(tx);
    });
  }
}
