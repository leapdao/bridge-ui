import { observable, reaction, action, when } from 'mobx';
import autobind from 'autobind-decorator';
import Web3 from './ts_workaround.js';
import PlasmaConfig from '../plasmaConfig';

export default class Web3Root {
  @observable.ref
  public instance: Web3;

  @observable
  public latestBlockNum;

  constructor(
    public plasmaConfig: PlasmaConfig,
  ) {
    if (plasmaConfig.rootNetwork) {
      this.setRootWeb3();
    } else {
      reaction(() => plasmaConfig.rootNetwork, this.setRootWeb3);
    }
  
    const updateRootBlock = blockNumber => {
      this.latestBlockNum = Number(blockNumber);
    };

    const fetchLatestBlock = () => {
      this.instance.eth.getBlockNumber().then(updateRootBlock);
    };

    when(
      () => !!this.instance,
      () => {
        fetchLatestBlock();
        setInterval(fetchLatestBlock, 15000);
      }
    );
  }
  
  @autobind
  @action
  private setRootWeb3() {
    if (!this.plasmaConfig) return;
    const wssfy = (url) => url.replace(/https?(.+)\/?/, 'wss$1/ws');
    this.instance = new Web3(wssfy(this.plasmaConfig.rootNetwork));
  }
}
