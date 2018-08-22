/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */


import Web3 from 'web3';
import { observable, action, computed } from 'mobx';
import autobind from 'autobind-decorator';
import getParsecWeb3 from '../utils/getParsecWeb3';


export default class Explorer {
  private web3: Web3;
  private cache;
  private blockchain;
  private latestBlock: number;

  @observable public initialSync: boolean;
  @observable public searching: boolean;
  @observable public success: boolean;

  @observable public current;

  constructor() {
    this.cache = {};
    this.blockchain = [];
    this.web3 = getParsecWeb3();
    this.initialSync = true;
    this.init(); 
  }

  public async search(hashOrNumber) {
    this.searching = true;
    let result;
    if (this.web3.utils.isAddress(hashOrNumber)) {
      result = await this.getAddress(hashOrNumber);
    } else {
      result = await this.getBlockOrTx(hashOrNumber);
    }
    this.success = result ? true : false;
    this.current = result ? result : this.current;
    this.searching = false;
    console.log(this.current);
  }

  @computed
  public get currentType() {
    if (this.current.uncles) {
      return "BLOCK";
    }
    if (this.current.value) {
      return "TRANSACTION";
    }
    if (this.current.balance) {
      return "ADDRESS";
    }
    return undefined;
  }

  private async init() {
    this.latestBlock = await this.web3.eth.getBlockNumber();
    const blocks = [];
    for (var i = 2; i <= this.latestBlock; i++) {
        blocks.push(i);
    }
    this.blockchain = await Promise.all(blocks.map(nr => this.getBlockOrTx(nr)));
    await this.search(this.latestBlock);
    this.initialSync = false;
  }

  private async getAddress(address) {
    const balance = await this.web3.eth.getBalance(address);
    const txs = this.blockchain.map(block => {
      return block.transactions.map(tx => {
        return (tx.from == address || tx.to == address) ? tx : undefined;
      });
    }).reduce((pre, cur) => {
      return pre.concat(cur);
    }).filter(ele => ele);
    const result = {
      address: address,
      balance: balance,
      txs: txs, 
    }
    return result;
  }

  private async getBlockOrTx(hashOrNumber) {
    if(this.cache[hashOrNumber]) {
      return this.cache[hashOrNumber];
    }
    if (localStorage.getItem("PSC:" + hashOrNumber)) {
      const blockOrTx = JSON.parse(localStorage.getItem("PSC:" + hashOrNumber));
      this.cache[hashOrNumber] = blockOrTx;
      return blockOrTx;
    }
    let block, tx;
    try{block = await this.web3.eth.getBlock(hashOrNumber, true);}catch{};
    try{tx = await this.web3.eth.getTransaction(hashOrNumber);}catch{};

    if (block) {
      localStorage.setItem("PSC:" + block.number.toString(), JSON.stringify(block));
      localStorage.setItem("PSC:" + block.hash, JSON.stringify(block));
      this.cache[block.number.toString()] = block;
      this.cache[block.hash] = block;
      block.transactions.map(tx => {
        localStorage.setItem("PSC:" + tx.hash, JSON.stringify(tx));
        this.cache[tx.hash] = tx;
      })
      return block;
    }
    if (tx) {
      localStorage.setItem("PSC:" + hashOrNumber, JSON.stringify(tx));
      this.cache[hashOrNumber] = tx;
      return tx;
    }
    return undefined;
  }
}
