/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, reaction, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import Contract from 'web3/eth/contract';
import { operator as operatorAbi } from '../utils/abis';

import Token from './token';
import Slot from './slot';
import Account from './account';
import ContractStore from './contractStore';
import Transactions from '../components/txNotification/transactions';

import { range } from '../utils';
import { InflightTxReceipt } from '../utils/types';
import Web3Store from './web3';

const readSlots = (operator: Contract) => {
  return operator.methods
    .epochLength()
    .call()
    .then(epochLength =>
      Promise.all(
        range(0, epochLength - 1).map(slotId =>
          operator.methods.slots(slotId).call()
        )
      )
    )
    .then(slots => {
      return slots.map(
        ({
          0: eventCounter,
          1: owner,
          2: stake,
          3: signer,
          4: tendermint,
          5: activationEpoch,
          6: newOwner,
          7: newStake,
          8: newSigner,
          9: newTendermint,
        }) =>
          new Slot({
            eventCounter,
            owner,
            stake: Number(stake),
            signer,
            tendermint,
            activationEpoch: Number(activationEpoch),
            newOwner,
            newStake: Number(newStake),
            newSigner,
            newTendermint,
          })
      );
    });
};

export default class Operator extends ContractStore {
  @observable
  public slots: IObservableArray<Slot> = observable.array([]);

  @observable
  public lastCompleteEpoch: number;

  @observable
  public defaultAddress: string;

  constructor(
    private account: Account,
    transactions: Transactions,
    web3: Web3Store,
    address?: string
  ) {
    super(operatorAbi, address, transactions, web3);

    web3.plasma.getConfig().then(({ operatorAddr }) => {
      this.address = operatorAddr;
    });

    reaction(() => {
      return this.contract;
    }, this.init);
    reaction(
      () => this.events,
      () => {
        this.events.on('allEvents', this.loadContractData.bind(this));
      }
    );
  }

  @autobind
  private init() {
    this.loadContractData();
  }

  @autobind
  @action
  private updateData([slots, lastCompleteEpoch]: [Array<Slot>, string]) {
    this.slots = observable.array(slots);
    this.lastCompleteEpoch = Number(lastCompleteEpoch);
  }

  private loadContractData() {
    Promise.all([
      readSlots(this.contract),
      this.contract.methods.lastCompleteEpoch().call(),
    ]).then(this.updateData);
  }

  public bet(
    token: Token,
    slotId: number,
    stake: any,
    signerAddr: string,
    tendermint: string
  ): Promise<InflightTxReceipt> {
    const data = this.contract.methods
      .bet(slotId, stake, signerAddr, `0x${tendermint}`)
      .encodeABI();

    const inflightTxReceiptPromise = token.approveAndCall(
      this.address,
      stake,
      data
    );

    this.watchTx(inflightTxReceiptPromise, 'bet', {
      message: 'Place a bet to the bridge contract',
    });

    return inflightTxReceiptPromise;
  }
}
