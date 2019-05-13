/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { computed, observable } from 'mobx';
import { TransactionReceipt } from 'web3/types';
import Contract from 'web3/eth/contract';
import PromiEvent from 'web3/promiEvent';
import { InflightTxReceipt } from '../utils/types';

import { web3RootStore } from './web3/root';
import { web3InjectedStore } from './web3/injected';
import { web3PlasmaStore } from './web3/plasma';
import { transactionsStore } from '../components/txNotification/transactions';

export class ContractStore {
  @observable
  public address: string;

  constructor(public abi: any[], address: string) {
    this.address = address;
  }

  @computed
  public get contract(): Contract {
    if (this.address) {
      return new web3RootStore.instance.eth.Contract(this.abi, this.address);
    }
  }

  @computed
  public get iContract(): Contract | undefined {
    if (web3InjectedStore.instance) {
      return new web3InjectedStore.instance.eth.Contract(
        this.abi,
        this.address
      );
    }
  }

  @computed
  public get plasmaContract(): Contract | undefined {
    return new web3PlasmaStore.instance.eth.Contract(this.abi, this.address);
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
      transactionsStore.update({
        ...metadata,
        key,
        futureReceipt: inflightTxReceipt.futureReceipt,
      });
    });
  }
}
