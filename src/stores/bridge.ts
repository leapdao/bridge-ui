/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { reaction, action, computed } from 'mobx';
import autobind from 'autobind-decorator';
import { bridge as bridgeAbi } from '../utils/abis';
import { ContractStore } from './contractStore';
import { plasmaConfigStore } from './plasmaConfig';
import { BlockType } from 'web3/eth/types';

export class BridgeStore extends ContractStore {
  constructor(address?: string) {
    super(bridgeAbi, address);

    if (plasmaConfigStore.bridgeAddr) {
      this.setAddress();
    } else {
      reaction(() => plasmaConfigStore.bridgeAddr, this.setAddress);
    }
  }

  @autobind
  @action
  private setAddress() {
    if (!plasmaConfigStore.bridgeAddr) {
      return;
    }
    this.address = plasmaConfigStore.bridgeAddr;
  }

  @computed
  public get genesisBlockNumber(): Promise<BlockType> {
    return this.contract.methods.genesisBlockNumber().call();
  }
}

export const bridgeStore = new BridgeStore();
