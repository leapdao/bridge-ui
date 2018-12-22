import { observable, action } from 'mobx';
import Web3Type from 'web3';
import { helpers, ExtendedWeb3 } from 'leap-core';
import Web3 from './web3_ts_workaround';
const config = require('../utils/config');

import {
  PLASMA_NODES,
  DEFAULT_PLASMA_NODE,
  NETWORKS,
  DEFAULT_NETWORK,
} from '../utils';

export default class Web3Store {
  @observable.ref
  public injected: Web3Type | null = null;

  @observable.ref
  public plasma: ExtendedWeb3;

  @observable
  public plasmaReady;

  @observable.ref
  public local: Web3Type;

  @observable
  public injectedAvailable = false;

  @observable
  public approved = false;

  @observable
  public injectedReady = false;

  constructor() {
    const plasmaProvider =
      config.plasmaNodeUrl 
      || PLASMA_NODES[process.env.PLASMA_NODE || DEFAULT_PLASMA_NODE];

    this.plasma = helpers.extendWeb3(
      new Web3(new Web3.providers.HttpProvider(plasmaProvider))
    );
    this.plasma.eth.net
      .getId()
      .then(_ => {
        this.plasmaReady = true;
      })
      .catch(e => {
        console.error('Leap node error', e);
        this.plasmaReady = false;
      });

    const localNetwork = NETWORKS[config.rootNetworkId || process.env.NETWORK_ID || DEFAULT_NETWORK];

    this.local = new Web3(
      new Web3.providers.HttpProvider(localNetwork.provider)
    );

    const { ethereum, web3 } = window as any;
    const metamask = ethereum && ethereum._metamask; // eslint-disable-line no-underscore-dangle

    this.injectedAvailable = !!(ethereum || web3);
    if (metamask) {
      setTimeout(() => {
        if (metamask.isEnabled()) {
          this.updateInjected(ethereum);
        } else {
          metamask.isApproved().then(approved => {
            this.updateInjected(approved ? ethereum : null, approved);
          });
        }
      }, 500);
    } else if (web3) {
      this.updateInjected(web3.currentProvider);
    } else {
      this.updateInjected(null, false);
    }
  }

  @action
  private updateInjected(provider, approved = true) {
    this.injectedReady = true;
    this.approved = approved;
    if (provider) {
      this.injected = new Web3(provider);
    }
  }

  public enable() {
    const { ethereum } = window as any;
    const metamask = ethereum && ethereum._metamask; // eslint-disable-line no-underscore-dangle

    if (!metamask) {
      throw new Error('Only for EIP-1102 compilant metamask');
    }

    ethereum
      .enable()
      .then(() => {
        this.injected = new Web3(ethereum);
        this.approved = true;
      })
      .catch(() => {});
  }
}
