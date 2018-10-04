/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 = require('web3'); // weird imports for strange typings
import { computed, observable } from 'mobx';
import Contract from 'web3/eth/contract';
import PromiEvent from 'web3/promiEvent';
import { TransactionReceipt } from 'web3/types';
import Transactions from '../components/txNotification/transactions';
import getWeb3 from '../utils/getWeb3';
import { InflightTxReceipt } from '../utils/types';
import ContractEventsSubscription from '../utils/ContractEventsSubscription';

export default class ContractStore {
  @observable
  public address: string;
  public abi: any[];
  public iWeb3?: Web3;
  public transactions: Transactions;
  private activeEventSub: ContractEventsSubscription;

  constructor(abi: any[], address: string, transactions: Transactions) {
    this.abi = abi;
    this.address = address;
    this.transactions = transactions;
  }

  @computed
  public get events(): ContractEventsSubscription | undefined {
    if (!this.contract.options.address) return;
    console.log(
      `Setting up event listener for contract at ${
        this.contract.options.address
      }..`
    );
    if (this.activeEventSub) {
      console.log('Stopping the old subscription..');
      this.activeEventSub.stop();
    }
    this.activeEventSub = new ContractEventsSubscription(
      this.contract,
      getWeb3()
    );
    this.activeEventSub.start();
    return this.activeEventSub;
  }

  @computed
  public get contract(): Contract {
    const web3 = getWeb3() as Web3;
    return new web3.eth.Contract(this.abi, this.address);
  }

  @computed
  public get iContract(): Contract | undefined {
    if ((window as any).web3) {
      this.iWeb3 = getWeb3(true) as Web3;
      return new this.iWeb3.eth.Contract(this.abi, this.address);
    }
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
