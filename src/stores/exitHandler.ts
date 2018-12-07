/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, reaction, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import Contract from 'web3/eth/contract';
import { exitHandler as exitHandlerAbi } from '../utils/abis';

import Token from './token';
import Slot from './slot';
import Account from './account';
import ContractStore from './contractStore';
import Transactions from '../components/txNotification/transactions';

import { range } from '../utils';
import { InflightTxReceipt } from '../utils/types';
import Web3Store from './web3';

export default class ExitHandler extends ContractStore {
  @observable
  public defaultAddress: string;

  constructor(
    private account: Account,
    transactions: Transactions,
    web3: Web3Store,
    address?: string
  ) {
    super(exitHandlerAbi, address, transactions, web3);

    web3.plasma.getConfig().then(({ exitHandlerAddr }) => {
      this.address = exitHandlerAddr;
    });
  }

  public deposit(token: Token, amount: any): Promise<InflightTxReceipt> {
    if (!this.iContract) {
      throw new Error('No metamask');
    }

    const data = this.contract.methods
      .deposit(this.account.address, amount, token.color)
      .encodeABI();

    const inflightTxReceiptPromise = token.approveAndCall(
      this.address,
      amount,
      data
    );

    this.watchTx(inflightTxReceiptPromise, 'deposit', {
      message: 'Deposit tokens to the bridge',
    });

    return inflightTxReceiptPromise;
  }

  public registerToken(tokenAddr: string) {
    const tx = this.iContract.methods.registerToken(tokenAddr).send({
      from: this.account.address,
    });

    this.watchTx(tx, 'registerToken', {
      message: 'Register a new token on the bridge',
    });

    return tx;
  }

  public startExit(proof: string[], outIndex: number) {
    const tx = this.iContract.methods.startExit(proof, outIndex).send({
      from: this.account.address,
    });

    this.watchTx(tx, 'startExit', {
      message: 'Exit',
    });

    return tx;
  }

  public finalizeExits(color: number) {
    const tx = this.iContract.methods.finalizeTopExit(color).send({
      from: this.account.address,
    });

    this.watchTx(tx, 'finalizeTopExit', {
      message: 'Finalize exit',
    });

    return tx;
  }
}
