import { observable } from 'mobx';
import autobind from 'autobind-decorator';
import { web3PlasmaStore } from './web3/plasma';

export class NodeStore {
  @observable
  public latestBlock: number = 0;

  constructor() {
    this.loadLatestBlock();
    setInterval(this.loadLatestBlock, 2000);
  }

  @autobind
  private loadLatestBlock() {
    web3PlasmaStore.instance.eth.getBlockNumber().then((num: number) => {
      if (this.latestBlock !== num) {
        this.latestBlock = num;
      }
    });
  }
}

export const nodeStore = new NodeStore();
