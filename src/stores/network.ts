/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, computed, reaction, action } from 'mobx';
import autobind from 'autobind-decorator';

import Account from './account';
import Web3Store from './web3/';
import PlasmaConfig from './plasmaConfig';

const PUBLIC_NETWORKS = {
  1: { name: 'Mainnet', provider: 'https://mainnet.infura.io', etherscanBase: 'https://etherscan.io' },
  3: { name: 'Ropsten', provider: 'https://ropsten.infura.io', etherscanBase: 'https://ropsten.etherscan.io' },
  4: { name: 'Rinkeby', provider: 'https://rinkeby.infura.io', etherscanBase: 'https://rinkeby.etherscan.io' },
  42: { name: 'Kovan', provider: 'https://kovan.infura.io', etherscanBase: 'https://kovan.etherscan.io' },
};

export default class Network {
  @observable
  private _mmNetwork: string;

  @observable
  public provider: string;

  @observable
  public name: string;

  @observable
  public etherscanBase: string;

  @observable
  public networkId: string;

  constructor(
    private readonly account: Account,
    private readonly web3: Web3Store,
    private readonly plasmaConfig: PlasmaConfig,
  ) {
    if (this.web3.injected.instance) {
      this.fetchNetwork();
    } else {
      reaction(() => this.web3.injected.instance, this.fetchNetwork);
    }

    if (this.plasmaConfig.rootNetwork) {
      this.setRootNetwork();
    } else {
      reaction(() => this.plasmaConfig.rootNetwork, this.setRootNetwork);
    }
  }

  @autobind
  private fetchNetwork() {
    this.web3.injected.instance.eth.net.getId().then(mmNetwork => {
      this._mmNetwork = String(mmNetwork);
    });
  }

  @computed
  public get mmNetwork() {
    return this._mmNetwork;
  }

  @computed
  public get canSubmit() {
    return (
      !!(window as any).web3 &&
      !!this.account.address &&
      this.networkId === this.mmNetwork
    );
  }

  @computed
  public get wrongNetwork() {
    return this.mmNetwork && this.networkId !== this.mmNetwork;
  }

  private getPublicNetwork(rootNetwork: string) {
    if (rootNetwork.match(/https?:\/\/(localhost|127\.0\.0\.1).*/)) {
      return { name: 'Local network', id: '5777' };
    }
    
    if (rootNetwork.startsWith('http')) {
      const nId = Object.keys(PUBLIC_NETWORKS).find(nId => 
        PUBLIC_NETWORKS[nId].provider === rootNetwork
      );
      return { id: nId, ...PUBLIC_NETWORKS[nId] };
    }

    return {
      ...PUBLIC_NETWORKS[rootNetwork] || [],
      id: rootNetwork
    };
  }

  @autobind
  @action
  private setRootNetwork() {
    const { rootNetwork } = this.plasmaConfig;
    this.provider = rootNetwork;

    const publicNetwork = this.getPublicNetwork(rootNetwork);
    if (!publicNetwork) {
      this.name = rootNetwork;
      console.warn('Unidentified network:', rootNetwork);
    }

    this.name = publicNetwork.name;
    this.etherscanBase = publicNetwork.etherscanBase;
    this.networkId = publicNetwork.id;      
  }
}
