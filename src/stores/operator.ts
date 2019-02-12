/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, reaction, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import { Contract } from 'web3-eth-contract';
import { operator as operatorAbi } from '../utils/abis';

import Token from './token';
import Slot from './slot';
import ContractStore from './contractStore';
import Transactions from '../components/txNotification/transactions';

import { range } from '../utils';
import { InflightTxReceipt } from '../utils/types';
import Web3Store from './web3/';
import PlasmaConfig from './plasmaConfig';

const poaDefaults = { owner: '0x', stake: 0, newOwner: '0x', newStake: 0 };

const mapSlot = (slotData): Slot => {
  const slot = Object.assign({}, poaDefaults, slotData);
  return new Slot({
    ...slot,
    stake: Number(slot.stake),
    activationEpoch: Number(slot.activationEpoch),
    newStake: Number(slot.newStake),
  });
};

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
    .then(slots => slots.map(mapSlot));
};

export default class Operator extends ContractStore {
  @observable
  public slots: IObservableArray<Slot> = observable.array([]);

  @observable
  public lastCompleteEpoch: number;

  constructor(
    transactions: Transactions,
    web3: Web3Store,
    private readonly plasmaConfig: PlasmaConfig,
    address?: string
  ) {
    super(operatorAbi, address, transactions, web3);

    if (plasmaConfig.operatorAddr) {
      this.setAddress();
    } else {
      reaction(() => plasmaConfig.operatorAddr, this.setAddress);
    }

    reaction(() => {
      return this.contract;
    }, this.init);
    reaction(
      () => this.contract,
      () => {
        this.contract.events.allEvents({}, this.loadContractData);
      }
    );
  }

  @autobind
  @action
  private setAddress() {
    if (!this.plasmaConfig.operatorAddr) return;
    this.address = this.plasmaConfig.operatorAddr;
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

  @autobind
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
      .bet(slotId, String(stake), signerAddr, `0x${tendermint}`)
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
