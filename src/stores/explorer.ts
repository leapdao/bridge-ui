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
import { Block, Transaction } from 'web3/eth/types';
import { range } from '../utils/range';

const LS_PREFIX = 'PSC1:';

export enum Types {
  BLOCK,
  TRANSACTION,
  ADDRESS,
}

export default class Explorer {
  private web3: Web3;
  private cache;
  private blockchain: Block[] = [];
  private latestBlock: number = 2;

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
    this.web3 = getParsecWeb3();
    this.initialSync = true;
    this.init();
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

  public search(hashOrNumber) {
    this.searching = true;
    (hashOrNumber
      ? Promise.resolve(hashOrNumber)
      : this.web3.eth.getBlockNumber()
    ).then(searchParam => {
      (this.web3.utils.isAddress(searchParam)
        ? this.getAddress(searchParam)
        : this.getBlockOrTx(searchParam)
      ).then(result => {
        this.success = !!result;
        this.current = result || this.current;
        this.searching = false;
      });
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
    this.initialSync = false;
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
    // if (localStorage.getItem(LS_PREFIX + hashOrNumber)) {
    //   const blockOrTx = JSON.parse(
    //     localStorage.getItem(LS_PREFIX + hashOrNumber)
    //   );
    //   this.cache[hashOrNumber] = blockOrTx;
    //   return Promise.resolve(blockOrTx);
    // }

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
          localStorage.setItem(
            LS_PREFIX + blockOrTx.number.toString(),
            JSON.stringify(blockOrTx)
          );
          localStorage.setItem(
            LS_PREFIX + blockOrTx.hash,
            JSON.stringify(blockOrTx)
          );
          this.cache[blockOrTx.number.toString()] = blockOrTx;
          this.cache[blockOrTx.hash] = blockOrTx;
          blockOrTx.transactions.forEach(tx => {
            //   localStorage.setItem(LS_PREFIX + tx.hash, JSON.stringify(tx));
            this.cache[tx.hash] = tx;
          });

          return blockOrTx;
        }
        if (type === Types.TRANSACTION) {
          const tx = { ...blockOrTx, ...Tx.fromRaw(blockOrTx.raw).toJSON() };
          // localStorage.setItem(LS_PREFIX + hashOrNumber, JSON.stringify(tx));
          this.cache[hashOrNumber] = tx;
          return tx;
        }
        return undefined;
      });
  }
}
