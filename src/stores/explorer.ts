/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, computed, when } from 'mobx';
import { Tx, TxJSON, LeapTransaction, Unspent } from 'leap-core';
import { Block } from 'web3/eth/types';
import Web3Store from './web3/';
import Tokens from './tokens';
import PlasmaConfig from './plasmaConfig';
import { bi, BigIntType } from 'jsbi-utils';
import Token from './token';

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
  token?: Token;
};

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
    plasmaConfig: PlasmaConfig
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
    return Explorer.getType(this.current);
  }

  public getAddress(address: string): Promise<ExplorerAccount> {
    address = address.toLowerCase();
    const addressToken: Token | undefined = this.tokens.tokenForAddress(
      address
    );
    return this.web3.plasma.instance.getUnspent(address).then(unspents => {
      const colors = Array.from(
        new Set([0, ...unspents.map(u => u.output.color)])
      );
      return Promise.all(
        colors.map(color => {
          const colorToken = this.tokens.tokenForColor(color);
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
      Explorer.getType(this.cache[hash]) === Types.TRANSACTION
    ) {
      return Promise.resolve(this.cache[hash]);
    }

    return this.web3.plasma.instance.eth.getTransaction(hash).then(tx => {
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
      Explorer.getType(this.cache[hashOrNumber]) === Types.BLOCK
    ) {
      return Promise.resolve(this.cache[hashOrNumber]);
    }

    return this.web3.plasma.instance.eth
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
            return this.web3.plasma.instance.eth
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
