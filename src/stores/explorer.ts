/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 = require('web3'); // weird imports for strange typings
import { observable, computed } from 'mobx';
import getParsecWeb3 from '../utils/getParsecWeb3';
import { Tx } from 'parsec-lib';

export enum Types {
  BLOCK,
  TRANSACTION,
  ADDRESS,
}

export default class Explorer {
  private web3: Web3;
  private cache;
  private blockchain;
  private latestBlock: number;

  @observable
  public initialSync: boolean;
  @observable
  public searching: boolean;
  @observable
  public success: boolean;

  @observable
  public current;

  constructor() {
    this.cache = {};
    this.blockchain = [];
    this.web3 = getParsecWeb3();
    this.initialSync = true;
    this.init();
  }

  public search(hashOrNumber) {
    this.searching = true;
    (this.web3.utils.isAddress(hashOrNumber)
      ? this.getAddress(hashOrNumber)
      : this.getBlockOrTx(hashOrNumber)
    ).then(result => {
      this.success = !!result;
      this.current = result || this.current;
      this.searching = false;
    });
  }

  private static getType(obj) {
    if (obj) {
      if (obj.uncles) {
        return Types.BLOCK;
      }
      if (obj.value !== undefined) {
        return Types.TRANSACTION;
      }
      if (obj.balance) {
        return Types.ADDRESS;
      }
    }
    return undefined;
  }

  @computed
  public get currentType() {
    return Explorer.getType(this.current);
  }

  private init() {
    this.web3.eth
      .getBlockNumber()
      .then(latestBlock => {
        this.latestBlock = latestBlock;
        const blocks = [];
        for (var i = 2; i <= this.latestBlock; i++) {
          blocks.push(i);
        }
        return Promise.all(blocks.map(nr => this.getBlockOrTx(nr)))
          .then(bc => {
            this.blockchain = bc;
          })
          .then(() => {
            if (!this.current) {
              return this.search(this.latestBlock);
            }
          });
      })
      .then(() => {
        this.initialSync = false;
      });
  }

  private getAddress(address) {
    return this.web3.eth.getBalance(address).then(balance => {
      const txs = this.blockchain
        .map(block => {
          return block.transactions.map(tx => {
            return tx.from == address || tx.to == address ? tx : undefined;
          });
        })
        .reduce((pre, cur) => {
          return pre.concat(cur);
        })
        .filter(ele => ele);
      const result = {
        address: address,
        balance: balance,
        txs: txs,
      };
      return result;
    });
  }

  private getBlockOrTx(hashOrNumber) {
    if (this.cache[hashOrNumber]) {
      return Promise.resolve(this.cache[hashOrNumber]);
    }
    if (localStorage.getItem('PSC:' + hashOrNumber)) {
      const blockOrTx = JSON.parse(localStorage.getItem('PSC:' + hashOrNumber));
      this.cache[hashOrNumber] = blockOrTx;
      return Promise.resolve(blockOrTx);
    }

    return this.web3.eth
      .getBlock(hashOrNumber, true)
      .then(
        block => block || (this.web3.eth.getTransaction(hashOrNumber) as any)
      )
      .then(blockOrTx => {
        const type = Explorer.getType(blockOrTx);

        if (type === Types.BLOCK) {
          blockOrTx.transactions = blockOrTx.transactions.map(tx => ({
            ...tx,
            ...Tx.fromRaw(tx.raw),
          }));
          localStorage.setItem(
            'PSC:' + blockOrTx.number.toString(),
            JSON.stringify(blockOrTx)
          );
          localStorage.setItem(
            'PSC:' + blockOrTx.hash,
            JSON.stringify(blockOrTx)
          );
          this.cache[blockOrTx.number.toString()] = blockOrTx;
          this.cache[blockOrTx.hash] = blockOrTx;
          blockOrTx.transactions.forEach(tx => {
            localStorage.setItem('PSC:' + tx.hash, JSON.stringify(tx));
            this.cache[tx.hash] = tx;
          });

          return blockOrTx;
        }
        if (type === Types.TRANSACTION) {
          const tx = { ...blockOrTx, ...Tx.fromRaw(blockOrTx.raw) };
          localStorage.setItem('PSC:' + hashOrNumber, JSON.stringify(tx));
          this.cache[hashOrNumber] = tx;
          return tx;
        }
        return undefined;
      });
  }
}
