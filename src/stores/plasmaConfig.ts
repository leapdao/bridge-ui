/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, reaction } from 'mobx';
import { web3PlasmaStore } from './web3/plasma';
import autobind from 'autobind-decorator';

export class PlasmaConfigStore {
  // DEPRECATED. Use rootNetworkId instead
  @observable
  public rootNetwork: string;

  @observable
  public rootNetworkId: number;

  @observable
  public exitHandlerAddr: string;

  @observable
  public bridgeAddr: string;

  @observable
  public operatorAddr: string;

  @observable
  public rootEventDelay: number;

  constructor() {
    if (web3PlasmaStore.ready) {
      this.fetchConfig();
    } else {
      reaction(() => web3PlasmaStore.ready, this.fetchConfig);
    }
  }

  @autobind
  private fetchConfig() {
    web3PlasmaStore.instance
      .getConfig()
      .then(
        ({
          rootNetwork,
          rootNetworkId,
          exitHandlerAddr,
          bridgeAddr,
          operatorAddr,
          bridgeDelay,
        }: any) => {
          this.rootNetwork = rootNetwork;
          this.rootNetworkId = rootNetworkId;
          this.exitHandlerAddr = exitHandlerAddr;
          this.bridgeAddr = bridgeAddr;
          this.operatorAddr = operatorAddr;
          this.rootEventDelay = Number(bridgeDelay);
        }
      );
  }
}

export const plasmaConfigStore = new PlasmaConfigStore();
