import { observable } from 'mobx';
import { helpers, ExtendedWeb3 } from 'leap-core';
import Web3 from './ts_workaround.js';
import { CONFIG } from '../../config';

export class Web3PlasmaStore {
  @observable.ref
  public instance: ExtendedWeb3;

  @observable
  public ready;

  constructor() {
    const plasmaProvider = CONFIG.nodes && CONFIG.nodes[0].url;

    this.instance = helpers.extendWeb3(new Web3(plasmaProvider));

    this.instance.eth.net
      .getId()
      .then(_ => {
        this.ready = true;
      })
      .catch(e => {
        console.error('Leap node error', e);
        this.ready = false;
      });
  }
}

export const web3PlasmaStore = new Web3PlasmaStore();
