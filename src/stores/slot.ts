/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, computed } from 'mobx';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

export default class Slot {
  @observable
  public eventCounter: string;
  @observable
  public owner: string;
  @observable
  public signer: string;
  @observable
  public stake: number;
  @observable
  public tendermint: string;
  @observable
  public activationEpoch: number;
  @observable
  public newOwner: string;
  @observable
  public newSigner: string;
  @observable
  public newStake: number;
  @observable
  public newTendermint: string;

  constructor(data: {
    eventCounter: string;
    owner: string;
    signer: string;
    stake: number;
    tendermint: string;
    activationEpoch: number;
    newOwner: string;
    newSigner: string;
    newStake: number;
    newTendermint: string;
  }) {
    Object.assign(this, data);
  }

  @computed
  public get isFree() {
    return this.owner === EMPTY_ADDRESS;
  }

  @computed
  public get willChange() {
    return this.newSigner !== EMPTY_ADDRESS;
  }
}
