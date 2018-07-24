/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, autorun, computed, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import BigNumber from 'bignumber.js';
// import { Contract } from 'web3/types';
import { bridge as bridgeAbi } from '../utils/abis';

import Token from './token';
import Account from './account';
import ContractStore from './contractStore';

type Slot = {
  owner: string;
  signer: string;
  stake: number;
  tendermint: string;
  activationEpoch: number;
  newOwner: string;
  newSigner: string;
  newStake: number;
  newTendermint: string;
};

export default class Bridge extends ContractStore {
  private account: Account;

  @observable public slots: IObservableArray<Slot>;

  constructor(account: Account, address: string) {
    super(bridgeAbi, address);
    this.account = account;
  }

  public deposit(token: Token, amount: any) {
    if (!this.iContract) {
      throw new Error('No metamask');
    }

    const data = this.contract.methods
      .deposit(this.account.address, amount, token.color)
      .encodeABI();

    const tx = token.approveAndCall(this.address, amount, data);

    // tx.on('confirmation', this.loadBalance);

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

    // tx.on('confirmation', this.loadBalance);

    return tx;
  }
}
