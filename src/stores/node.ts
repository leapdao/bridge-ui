import { observable } from 'mobx';
import autobind from 'autobind-decorator';
import getParsecWeb3 from '../utils/getParsecWeb3';

export default class NodeStore {
  @observable
  public latestBlock: number = 0;

  constructor() {
    this.loadLatestBlock();
    setInterval(this.loadLatestBlock, 2000);
  }

  @autobind
  private loadLatestBlock() {
    getParsecWeb3()
      .eth.getBlockNumber()
      .then((num: number) => {
        if (this.latestBlock !== num) {
          this.latestBlock = num;
        }
      });
  }
}
