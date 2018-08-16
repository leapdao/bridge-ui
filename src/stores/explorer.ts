/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */


import Web3 from 'web3';
import { observable, action, autorun, computed, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';
import BigNumber from 'bignumber.js';
import getParsecWeb3 from '../utils/getParsecWeb3';

//Import other stores here


export default class Explorer {
  private web3: Web3;

  @observable public current;

  constructor() {
    this.web3 = getParsecWeb3();
    this.getBlock('latest');
  }

  @autobind
  public getBlock(number) {
    let block;
    this.web3.eth.getBlock(number).then(blk => {
      block = blk;
      return Promise.all(blk.transactions.map(this.web3.eth.getTransaction));
    }).then(txs => {
      block.transactions = txs;
      this.updateCurrent(block);
    });
  }

  @autobind
  @action
  private updateCurrent(block) {
    this.current = block;
    console.log(block);
  }
}
