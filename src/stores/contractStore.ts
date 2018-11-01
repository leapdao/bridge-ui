/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 from 'web3';
import { computed, observable } from 'mobx';
import Contract from 'web3/eth/contract';
import PromiEvent from 'web3/promiEvent';
import { TransactionReceipt } from 'web3/types';
import Transactions from '../components/txNotification/transactions';
import getWeb3 from '../utils/getWeb3';
import getParsecWeb3 from '../utils/getParsecWeb3';
import { InflightTxReceipt } from '../utils/types';
import ContractEventsSubscription from '../utils/ContractEventsSubscription';
import Web3Store from './web3';

export default class ContractStore {
  @observable
  public address: string;

  private activeEventSub: ContractEventsSubscription;

  constructor(
    public abi: any[],
    address: string,
    public transactions: Transactions,
    public web3: Web3Store
  ) {
    this.address = address;
  }

  @computed
  public get events(): ContractEventsSubscription | undefined {
    if (!this.contract) return;
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
    console.log(this.address);
    if (this.address) {
      return new web3.eth.Contract(this.abi, this.address);
    }
  }

  @computed
  public get iContract(): Contract | undefined {
    if (this.web3.injected) {
      return new this.web3.injected.eth.Contract(this.abi, this.address);
    }
  }

  @computed
  public get plasmaContract(): Contract | undefined {
    const web3 = getParsecWeb3() as Web3;
    return new web3.eth.Contract(this.abi, this.address);
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
