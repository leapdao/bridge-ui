/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, computed, when } from 'mobx';
import { Tx, TxJSON, LeapTransaction, Unspent } from 'leap-core';
import { Block } from 'web3/eth/types';
import { bi, BigIntType } from 'jsbi-utils';
import { TokenStore } from './token';
import { plasmaConfigStore } from './plasmaConfig';
import { tokensStore } from './tokens';
import { web3PlasmaStore } from './web3/plasma';

export enum Types {
  BLOCK,
  TRANSACTION,
  ADDRESS,
}

export type ColorsBalances = {
  [key: string]: BigIntType | BigIntType[];
};

export type ExplorerAccount = {
  address: string;
  balances: ColorsBalances;
  unspents: Unspent[];
  token?: TokenStore;
};

type PlasmaTransaction = LeapTransaction & TxJSON;

type PlasmaBlock = Block & {
  transactions: PlasmaTransaction[];
} & TxJSON;

export class ExplorerStore {
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

  constructor() {
    when(
      () => !!plasmaConfigStore.bridgeAddr,
      () => {
        this.storageKey = `EXPLORER_CACHE-${plasmaConfigStore.bridgeAddr}`;
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
    } catch (e) {
      console.error(e);
    }
  }

  private get cache() {
    return this._cache;
  }

  private setCache(key, value) {
    if (!this.storageKey) {
      return;
    }
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
    return ExplorerStore.getType(this.current);
  }

  public getAddress(address: string): Promise<ExplorerAccount> {
    address = address.toLowerCase();
    const addressToken = tokensStore.tokenForAddress(address);
    return web3PlasmaStore.instance.getUnspent(address).then(unspents => {
      const colors = Array.from(
        new Set([0, ...unspents.map(u => u.output.color)])
      );
      return Promise.all(
        colors.map(color => {
          const colorToken = tokensStore.tokenForColor(color);
          if (!colorToken) {
            return Promise.resolve(bi(0));
          }

          return colorToken.balanceOf(address, true);
        })
      )
        .then(balances => {
          return colors.reduce<ColorsBalances>((colorsBals, color, i) => {
            colorsBals[color] = balances[i];
            return colorsBals;
          }, {});
        })
        .then(balances => {
          return {
            address,
            token: addressToken,
            balances,
            unspents,
          };
        });
    });
  }

  public getTransaction(hash): Promise<PlasmaTransaction> {
    if (
      this.cache[hash] &&
      ExplorerStore.getType(this.cache[hash]) === Types.TRANSACTION
    ) {
      return Promise.resolve(this.cache[hash]);
    }

    return web3PlasmaStore.instance.eth.getTransaction(hash).then(tx => {
      if (tx) {
        const result: PlasmaTransaction = {
          ...tx,
          ...Tx.fromRaw((tx as any).raw).toJSON(),
        } as any;
        this.setCache(hash, result);
        return result;
      }
    });
  }

  public getBlock(hashOrNumber): Promise<PlasmaBlock> {
    if (
      this.cache[hashOrNumber] &&
      ExplorerStore.getType(this.cache[hashOrNumber]) === Types.BLOCK
    ) {
      return Promise.resolve(this.cache[hashOrNumber]);
    }

    return web3PlasmaStore.instance.eth
      .getBlock(hashOrNumber, true)
      .then(block => {
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
    if (web3PlasmaStore.instance.utils.isAddress(hashOrNumber)) {
      history.push(`/explorer/address/${hashOrNumber}`);
      this.searching = false;
      return Promise.resolve();
    } else {
      return web3PlasmaStore.instance.eth
        .getTransaction(hashOrNumber)
        .then(tx => {
          if (tx) {
            history.push(`/explorer/tx/${hashOrNumber}`);
          } else {
            return web3PlasmaStore.instance.eth
              .getBlock(hashOrNumber)
              .then(block => {
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

export const explorerStore = new ExplorerStore();
