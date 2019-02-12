/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { computed, observable } from 'mobx';
import { TransactionReceipt, PromiEvent } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import Transactions from '../components/txNotification/transactions';
import { InflightTxReceipt } from '../utils/types';
import Web3Store from './web3/';

export default class ContractStore {
  @observable
  public address: string;

  constructor(
    public abi: any[],
    address: string,
    public transactions: Transactions,
    public web3: Web3Store
  ) {
    this.address = address;
  }

  @computed
  public get contract(): Contract {
    if (this.address) {
      return new this.web3.root.instance.eth.Contract(this.abi, this.address);
    }
  }

  @computed
  public get iContract(): Contract | undefined {
    if (this.web3.injected.instance) {
      return new this.web3.injected.instance.eth.Contract(this.abi, this.address);
    }
  }

  @computed
  public get plasmaContract(): Contract | undefined {
    return new this.web3.plasma.instance.eth.Contract(this.abi, this.address);
  }

  public watchTx(
    txReceiptPromise:
      | Promise<InflightTxReceipt>
      | PromiEvent<TransactionReceipt>,
    key: string,
    metadata: object
  ) {
    const promise = (!!txReceiptPromise['once'] // check if we have PromiEvent<TransactionReceipt> ?
      ? Promise.resolve({ futureReceipt: txReceiptPromise })
      : txReceiptPromise) as Promise<InflightTxReceipt>;

    promise.then(inflightTxReceipt => {
      this.transactions.update({
        ...metadata,
        key,
        futureReceipt: inflightTxReceipt.futureReceipt,
      });
    });
  }
}
