/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 = require('web3'); // weird imports for strange typings
import { observable, computed, action } from 'mobx';
import autobind from 'autobind-decorator';
import getParsecWeb3 from '../utils/getParsecWeb3';
import { Tx } from 'parsec-lib';
import { Block, Transaction } from 'web3/eth/types';
import { range } from '../utils/range';

const LOCAL_STORAGE_KEY = 'EXPLORER_CACHE';

export enum Types {
  BLOCK,
  TRANSACTION,
  ADDRESS,
}

export default class Explorer {
  private web3: Web3 = getParsecWeb3();
  private blockchain: Block[] = [];
  private latestBlock: number = 2;
  private _cache = {};

  @observable
  public searching: boolean;

  @observable
  public success: boolean;

  @observable
  public current;

  constructor() {
    try {
      const lsCache = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (lsCache) {
        // this._cache = JSON.parse(lsCache);
      }
    } catch (e) {}
  }

  private get cache() {
    return this._cache;
  }

  private setCache(key, value) {
    this._cache[key] = value;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._cache));
  }

  private getBlockchain(): Promise<Block[]> {
    return this.web3.eth.getBlockNumber().then(blockNumber => {
      if (this.latestBlock === blockNumber) {
        return this.blockchain;
      }

      const fromBlock = this.latestBlock;
      this.latestBlock = blockNumber;

      return Promise.all(
        range(fromBlock, this.latestBlock).map(n => this.getBlockOrTx(n))
      ).then(blocks => {
        this.blockchain = this.blockchain.concat(blocks);
        return this.blockchain;
      });
    });
  }

  @autobind
  @action
  private finishSearch(result) {
    this.success = !!result;
    this.current = result || this.current;
    this.searching = false;
  }

  public search(hashOrNumber) {
    this.searching = true;
    (hashOrNumber
      ? Promise.resolve(hashOrNumber)
      : this.web3.eth.getBlockNumber()
    ).then(searchParam => {
      (this.web3.utils.isAddress(searchParam)
        ? this.getAddress(searchParam)
        : this.getBlockOrTx(searchParam)
      ).then(this.finishSearch);
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

  private getAddress(address) {
    return Promise.all([
      this.web3.eth.getBalance(address),
      this.getBlockchain(),
    ]).then(([balance, blocks]) => {
      const txs = blocks.reduce(
        (accum, block) =>
          accum.concat(
            block.transactions.filter(
              tx => tx.from === address || tx.to === address
            )
          ),
        [] as Transaction[]
      );
      return {
        address,
        balance,
        txs,
      };
    });
  }

  private getBlockOrTx(hashOrNumber) {
    if (this.cache[hashOrNumber]) {
      return Promise.resolve(this.cache[hashOrNumber]);
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
            ...Tx.fromRaw(tx.raw).toJSON(),
          }));
          this.setCache(blockOrTx.number, blockOrTx);
          this.setCache(blockOrTx.hash, blockOrTx);
          blockOrTx.transactions.forEach(tx => {
            this.setCache(tx.hash, tx);
          });

          return blockOrTx;
        }
        if (type === Types.TRANSACTION) {
          const tx = { ...blockOrTx, ...Tx.fromRaw(blockOrTx.raw).toJSON() };
          this.setCache(hashOrNumber, tx);
          return tx;
        }
        return undefined;
      });
  }
}
