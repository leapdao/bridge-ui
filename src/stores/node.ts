import { observable } from 'mobx';
import autobind from 'autobind-decorator';
import Web3Store from './web3/';

export default class NodeStore {
  @observable
  public latestBlock: number = 0;

  constructor(private web3: Web3Store) {
    this.loadLatestBlock();
    setInterval(this.loadLatestBlock, 2000);
  }

  @autobind
  private loadLatestBlock() {
    this.web3.plasma.instance.eth.getBlockNumber().then((num: number) => {
      if (this.latestBlock !== num) {
        this.latestBlock = num;
      }
    });
  }
}
