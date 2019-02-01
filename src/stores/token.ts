/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
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
import { helpers, Tx, Input, Output } from 'leap-core';
import * as Web3PromiEvent from 'web3-core-promievent';
import autobind from 'autobind-decorator';
import { EventLog } from 'web3/types';
import Contract from 'web3/eth/contract';
import { erc20, erc721 } from '../utils/abis';
import { isNFT } from '../utils';
import { txSuccess } from '../utils/txSuccess';

import Account from './account';
import ContractStore from './contractStore';
import Transactions from '../components/txNotification/transactions';
import { InflightTxReceipt } from '../utils/types';
import { range } from '../utils/range';
import NodeStore from './node';
import Web3Store from './web3/';

import { BigIntType, equal, bi, exponentiate, toNumber, ZERO } from 'jsbi-utils';

const Big = require('big.js');

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
  @observable.ref
  public balance?: BigIntType | BigIntType[];
  @observable.ref
  public plasmaBalance?: BigIntType | BigIntType[];

  constructor(
    account: Account,
    transactions: Transactions,
    address: string,
    color: number,
    private node: NodeStore,
    web3: Web3Store
  ) {
    super(isNFT(color) ? erc721 : erc20, address, transactions, web3);

    this.account = account;
    this.color = color;

    autorun(this.loadBalance.bind(null, false));
    autorun(this.loadBalance.bind(null, true));
    tokenInfo(this.contract, color).then(this.setInfo);

    if (this.events) {
      this.events.on('Transfer', (event: EventLog) => {
        if (isOurTransfer(event, this.account)) {
          this.loadBalance(false);
        }
      });
    }

    reaction(() => this.node.latestBlock, this.loadBalance.bind(null, true));
  }

  @computed
  public get decimalsBalance(): number {
    if (this.isNft) {
      return (this.balance as BigIntType[]).length;
    }

    return this.balance && this.toTokens(this.balance as BigIntType);
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
  public toCents(tokenValue: BigIntType | number | string): BigIntType {
    if (this.isNft) return bi(tokenValue);
    let valueNum;
    try {
      valueNum = Big(String(tokenValue));
    } catch(e) {
      return ZERO;
    }

    return bi(valueNum.mul(10 ** this.decimals).round().toFixed());
  }

  /**
   * Converts given amount of token cents to the whole token according to this token decimals.
   * Returns given value unchanged if this token is NFT.
   * @param tokenValue Amount of token cents to convert to tokens or token Id for NFT token
   */
  public toTokens(tokenCentsValue: BigIntType) {
    if (this.isNft) return toNumber(tokenCentsValue);
    return Big(tokenCentsValue.toString() || 0).div(10 ** this.decimals).toFixed();
  }

  public transfer(to: string, amount: BigIntType): Promise<any> {
    if (!this.web3.injected.instance) {
      return Promise.reject('No metamask');
    }

    const promiEvent = Web3PromiEvent();
    this.web3.plasma.instance
      .getUnspent(this.account.address)
      .then(unspent => {
        if (this.isNft) {
          const { outpoint } = unspent.find(
            ({ output }) =>
              Number(output.color) === Number(this.color) &&
              equal(bi(output.value), bi(amount))
          );
          const inputs = [new Input(outpoint)];
          const outputs = [new Output(amount as any, to, this.color)];
          return Tx.transfer(inputs, outputs);
        }

        const inputs = helpers.calcInputs(
          unspent,
          this.account.address,
          amount as any,
          this.color
        );
        const outputs = helpers.calcOutputs(
          unspent,
          inputs,
          this.account.address,
          to,
          amount as any,
          this.color
        );
        return Tx.transfer(inputs, outputs);
      })
      .then(tx => tx.signWeb3(this.web3.injected.instance as any))
      .then(
        signedTx => {
          promiEvent.eventEmitter.emit('transactionHash', signedTx.hash());
          return {
            futureReceipt: this.web3.plasma.instance.eth.sendSignedTransaction(
              signedTx.hex() as any
            ),
          };
        },
        err => {
          promiEvent.reject(err);
          promiEvent.eventEmitter.emit('error', err);
        }
      )
      .then(receipt => {
        promiEvent.eventEmitter.emit('receipt', receipt);
        promiEvent.resolve({
          ...receipt,
          status: 'success',
        });
      });

    this.watchTx(promiEvent.eventEmitter, 'plasmaSign', {
      message: 'Sign plasma transfer',
      description:
        'Before you proceed with your tx, you need to sign a message',
    });

    return txSuccess(promiEvent.eventEmitter);
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
      const futureReceipt = this.web3.injected.instance.eth.sendTransaction({
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
  private updateBalance(balance: BigIntType | BigIntType[], plasma = false) {
    if (plasma) {
      this.plasmaBalance = balance;
    } else {
      this.balance = balance;
    }
  }

  @autobind
  private loadBalance(plasma = false) {
    if (!this.account.address) {
      return;
    }
    const contract = plasma ? this.plasmaContract : this.contract;
    contract.methods
      .balanceOf(this.account.address)
      .call()
      .then((balance): Promise<BigIntType | BigIntType[]> => {
        if (this.isNft) {
          return Promise.all(
            range(0, balance - 1).map(i =>
              contract.methods
                .tokenOfOwnerByIndex(this.account.address, i)
                .call().then(v => bi(v))
            )
          ) as Promise<BigIntType[]>;
        }

        return Promise.resolve(bi(balance));
      })
      .then(balance => {
        this.updateBalance(balance, plasma);
      });
  }

  private allowanceOrTokenId(valueOrTokenId: number) {
    if (this.isNft) return valueOrTokenId;

    return `0x${exponentiate(bi(2), bi(255)).toString(16)}`;
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
        .approve(spender, String(this.allowanceOrTokenId(value)))
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
