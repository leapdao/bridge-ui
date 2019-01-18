import { observable, reaction, action } from 'mobx';
import autobind from 'autobind-decorator';
import Web3 from './ts_workaround.js';
import PlasmaConfig from '../plasmaConfig';

export default class Web3Root {
  @observable.ref
  public instance: Web3;

  constructor(
    public plasmaConfig: PlasmaConfig,
  ) {
    if (plasmaConfig.rootNetwork) {
      this.setRootWeb3();
    } else {
      reaction(() => plasmaConfig.rootNetwork, this.setRootWeb3);
    }
  }
  
  @autobind
  @action
  private setRootWeb3() {
    if (!this.plasmaConfig) return;
    this.instance = new Web3(
      new Web3.providers.HttpProvider(this.plasmaConfig.rootNetwork)
    );
  }
}
