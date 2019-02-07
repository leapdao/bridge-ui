/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, computed, reaction, when } from 'mobx';
import { Tx, TxJSON, LeapTransaction } from 'leap-core';
import { Block } from 'web3/eth/types';
import Web3Store from './web3/';
import Tokens from './tokens';
import PlasmaConfig from './plasmaConfig';

export enum Types {
  BLOCK,
  TRANSACTION,
  ADDRESS,
}

type PlasmaTransaction = LeapTransaction & TxJSON;

type PlasmaBlock = Block & {
  transactions: PlasmaTransaction[];
} & TxJSON;

export default class Explorer {
  private _cache = {};


  @observable
  public searching: boolean = false;

  @observable
  public syncing: boolean = false;

  @observable
  public success: boolean = true;

  @observable
  public current;

  private storageKey;

  constructor(
    private web3: Web3Store,
    private tokens: Tokens,
    plasmaConfig: PlasmaConfig,
  ) {
    when(
      () => !!plasmaConfig.bridgeAddr,
      () => {
        this.storageKey = `EXPLORER_CACHE-${plasmaConfig.bridgeAddr}`;    
        this.loadCache();
      }
    );
  }

  private loadCache() {
    try {
      const lsCache = localStorage.getItem(this.storageKey);
      if (lsCache) {
        this._cache = JSON.parse(lsCache);
      }
    } catch (e) {}
  }

  private get cache() {
    return this._cache;
  }

  private setCache(key, value) {
    if (!this.storageKey) return;
    this._cache[key] = value;
    localStorage.setItem(this.storageKey, JSON.stringify(this._cache));
  }

  private static getType(obj) {
    if (obj) {
      if (obj.uncles) {
        return Types.BLOCK;
      }
      if (obj.value !== undefined) {
        return Types.TRANSACTION;
      }
      if (obj.txs) {
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
    const token = this.tokens.tokenForAddress(address);
    return Promise.all([
      this.web3.plasma.instance.eth.getBalance(address),
      this.getTransactionsByAddress(address, token),
    ]).then(([balance, txs]) => {
      return {
        address,
        token,
        balance,
        txs,
      };
    });
  }

  public getTransaction(hash): Promise<PlasmaTransaction> {
    if (
      this.cache[hash] &&
      Explorer.getType(this.cache[hash]) === Types.TRANSACTION
    ) {
      return Promise.resolve(this.cache[hash]);
    }

    return this.web3.plasma.instance.eth.getTransaction(hash).then(tx => {
      if (tx) {
        const result = {
          ...tx,
          ...Tx.fromRaw((tx as any).raw).toJSON(),
        } as PlasmaTransaction;
        this.setCache(hash, result);
        return result;
      }
    });
  }

  public getBlock(hashOrNumber): Promise<PlasmaBlock> {
    if (
      this.cache[hashOrNumber] &&
      Explorer.getType(this.cache[hashOrNumber]) === Types.BLOCK
    ) {
      return Promise.resolve(this.cache[hashOrNumber]);
    }

    return this.web3.plasma.instance.eth.getBlock(hashOrNumber, true).then(block => {
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

        return block as PlasmaBlock;
      }
    });
  }

  public search(hashOrNumber, history) {
    this.searching = true;
    this.success = true;
    if (this.web3.plasma.instance.utils.isAddress(hashOrNumber)) {
      history.push(`/explorer/address/${hashOrNumber}`);
      this.searching = false;
      return Promise.resolve();
    } else {
      return this.web3.plasma.instance.eth
        .getTransaction(hashOrNumber)
        .then(tx => {
          if (tx) {
            history.push(`/explorer/tx/${hashOrNumber}`);
          } else {
            return this.web3.plasma.instance.eth.getBlock(hashOrNumber).then(block => {
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

  private getTransactionsByAddress(token, address): Promise<LeapTransaction[]> {
    // TODO: probably should be fetched from some caching layer
    // it is infeasible to calculate this on client-side because the chain may be huge
    console.warn('Not implemented');
    return Promise.resolve([]);
  }
}
