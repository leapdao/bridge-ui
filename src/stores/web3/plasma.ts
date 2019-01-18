import { observable } from 'mobx';
import { helpers, ExtendedWeb3 } from 'leap-core';
import Web3 from './ts_workaround.js';
import { CONFIG } from '../../config';

export default class Web3Plasma {
  @observable.ref
  public instance: ExtendedWeb3;

  @observable
  public ready;

  constructor() {
    const plasmaProvider = CONFIG.nodes && CONFIG.nodes[0].url;

    this.instance = helpers.extendWeb3(
      new Web3(new Web3.providers.HttpProvider(plasmaProvider))
    );

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
