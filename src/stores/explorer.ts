/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 from 'web3';
import { observable, computed, reaction } from 'mobx';
import getParsecWeb3 from '../utils/getParsecWeb3';
import { Tx, TxJSON } from 'parsec-lib';
import { Block, Transaction } from 'web3/eth/types';
import { range } from '../utils/range';
import autobind from 'autobind-decorator';
import NodeStore from './node';

const LOCAL_STORAGE_KEY = 'EXPLORER_CACHE';

export enum Types {
  BLOCK,
  TRANSACTION,
  ADDRESS,
}

type ParsecTransaction = Transaction & {
  raw: string;
} & TxJSON;

type ParsecBlock = Block & {
  transactions: ParsecTransaction[];
} & TxJSON;

const myTransaction = (addr: string) => {
  addr = addr.toLowerCase();
  return (tx: ParsecTransaction) => {
    const from = (tx.from || '').toLowerCase();
    const to = (tx.to || '').toLowerCase();
    return from === addr || to === addr;
  };
};

export default class Explorer {
  private web3: Web3 = getParsecWeb3();
  private blockchain: Block[] = [];
  private _cache = {};

  @observable
  private latestBlock: number = 0;

  @observable
  public searching: boolean = false;

  @observable
  public syncing: boolean = false;

  private syncingPromise: Promise<Block[]>;

  @observable
  public success: boolean = true;

  @observable
  public current;

  constructor(private node: NodeStore) {
    try {
      const lsCache = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (lsCache) {
        this._cache = JSON.parse(lsCache);
      }
    } catch (e) {}

    reaction(() => this.node.latestBlock, this.getBlockchain);
    // this.getBlockchain();
    // setInterval(this.getBlockchain, 5000);
  }

  private get cache() {
    return this._cache;
  }

  private setCache(key, value) {
    this._cache[key] = value;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._cache));
  }

  @autobind
  private getBlockchain(): Promise<Block[]> {
    this.syncing = true;
    if (this.syncingPromise) {
      return this.syncingPromise;
    }
    if (this.latestBlock === this.node.latestBlock) {
      return Promise.resolve(this.blockchain);
    }

    const fromBlock = this.latestBlock;
    this.latestBlock = this.node.latestBlock;

    this.syncingPromise = Promise.all(
      range(fromBlock, this.latestBlock).map(n => this.getBlock(n))
    ).then(blocks => {
      this.blockchain = this.blockchain.concat(blocks);
      this.syncing = false;
      this.syncingPromise = null;
      return this.blockchain;
    });

    return this.syncingPromise;
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

  public getAddress(address: string) {
    address = address.toLowerCase();
    return Promise.all([
      this.web3.eth.getBalance(address),
      this.getBlockchain(),
    ]).then(([balance, blocks]) => {
      const txs = blocks.reduce(
        (accum, block) =>
          accum.concat(block.transactions.filter(myTransaction(address))),
        [] as Transaction[]
      );
      return {
        address,
        balance,
        txs,
      };
    });
  }

  public getTransaction(hash): Promise<ParsecTransaction> {
    if (
      this.cache[hash] &&
      Explorer.getType(this.cache[hash]) === Types.TRANSACTION
    ) {
      return Promise.resolve(this.cache[hash]);
    }

    return this.web3.eth.getTransaction(hash).then(tx => {
      if (tx) {
        const result = {
          ...tx,
          ...Tx.fromRaw((tx as any).raw).toJSON(),
        } as ParsecTransaction;
        this.setCache(hash, result);
        return result;
      }
    });
  }

  public getBlock(hashOrNumber): Promise<ParsecBlock> {
    if (
      this.cache[hashOrNumber] &&
      Explorer.getType(this.cache[hashOrNumber]) === Types.BLOCK
    ) {
      return Promise.resolve(this.cache[hashOrNumber]);
    }

    return this.web3.eth.getBlock(hashOrNumber, true).then(block => {
      if (block) {
        block.transactions = block.transactions.map(tx => ({
          ...tx,
          ...Tx.fromRaw((tx as any).raw).toJSON(),
        }));
        this.setCache(block.number, block);
        this.setCache(block.hash, block);
        block.transactions.forEach(tx => {
          this.setCache(tx.hash, tx);
        });

        return block as ParsecBlock;
      }
    });
  }

  public search(hashOrNumber, history) {
    this.searching = true;
    this.success = true;
    if (this.web3.utils.isAddress(hashOrNumber)) {
      history.push(`/explorer/address/${hashOrNumber}`);
      this.searching = false;
      return Promise.resolve();
    } else {
      return this.web3.eth
        .getTransaction(hashOrNumber)
        .then(tx => {
          if (tx) {
            history.push(`/explorer/tx/${hashOrNumber}`);
          } else {
            return this.web3.eth.getBlock(hashOrNumber).then(block => {
              if (block) {
                history.push(`/explorer/block/${hashOrNumber}`);
              } else {
                this.success = false;
                return Promise.reject('Not found');
              }
            });
          }
        })
        .then(
          () => {
            this.searching = false;
          },
          err => {
            this.searching = false;
            return Promise.reject(err);
          }
        );
    }
  }
}
