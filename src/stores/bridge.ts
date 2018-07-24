/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import BigNumber from 'bignumber.js';
import { Contract } from 'web3/types';
import { bridge as bridgeAbi } from '../utils/abis';

import Token from './token';
import Slot from './slot';
import Account from './account';
import ContractStore from './contractStore';

import { range } from '../utils';

const readSlots = (bridge: Contract) => {
  return bridge.methods
    .epochLength()
    .call()
    .then(epochLength =>
      Promise.all(
        range(0, epochLength - 1).map(slotId =>
          bridge.methods.getSlot(slotId).call()
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
            stake: new BigNumber(stake),
            signer,
            tendermint,
            activationEpoch: Number(activationEpoch),
            newOwner,
            newStake: new BigNumber(newStake),
            newSigner,
            newTendermint,
          })
      );
    });
};

export default class Bridge extends ContractStore {
  private account: Account;

  @observable public slots: IObservableArray<Slot> = observable.array([]);
  @observable public lastCompleteEpoch: number;

  constructor(account: Account, address: string) {
    super(bridgeAbi, address);
    this.account = account;
    this.loadContractData();

    if ((window as any).web3) {
      // ToDo: events are not working with web3 1.0 for some reason. Need to fix
      const iWeb3 = (window as any).web3;
      const iContract = iWeb3.eth.contract(bridgeAbi).at(this.address);
      const allEvents = iContract.allEvents({
        toBlock: 'latest',
      } as any);
      allEvents.watch(() => {
        this.loadContractData();
      });
    }
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

  public deposit(token: Token, amount: any) {
    if (!this.iContract) {
      throw new Error('No metamask');
    }

    const data = this.contract.methods
      .deposit(this.account.address, amount, token.color)
      .encodeABI();

    const tx = token.approveAndCall(this.address, amount, data);

    tx.on('confirmation', this.loadContractData);

    return tx;
  }

  public bet(
    token: Token,
    slotId: number,
    stake: any,
    signerAddr: string,
    tendermint: string
  ) {
    const data = this.contract.methods
      .bet(slotId, stake, signerAddr, `0x${tendermint}`, this.account.address)
      .encodeABI();

    const tx = token.approveAndCall(this.address, stake, data);

    tx.on('confirmation', this.loadContractData);

    return tx;
  }
}
