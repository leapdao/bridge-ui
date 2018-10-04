/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 = require('web3'); // weird imports for strange typings
import { observable, reaction, computed } from 'mobx';
import { Unspent, helpers, Tx, Period, Block } from 'parsec-lib';
import Eth from 'web3/eth/index';
import { Transaction } from 'web3/eth/types';
import ethUtil from 'ethereumjs-util';

import Bridge from './bridge';
import Account from './account';
import autobind from 'autobind-decorator';
import { range } from '../utils/range';

const pWeb3 = helpers.extendWeb3(new Web3('http://localhost:8645'));

interface ParsecTransaction extends Transaction {
  raw: string;
}

type UnspentWithTx = Unspent & { transaction: ParsecTransaction };

function makePeriodFromRange(startBlock, endBlock) {
  // ToDo: fix typing in lib
  const eth = (pWeb3 as any).eth as Eth;
  return Promise.all(
    range(startBlock, endBlock - 1).map(n => eth.getBlock(n, true))
  ).then(blocks => {
    return new Period(
      null,
      blocks.filter(a => !!a).map(({ number, timestamp, transactions }) => {
        const block = new Block(number, {
          timestamp,
          txs: transactions.map((tx: ParsecTransaction) => Tx.fromRaw(tx.raw)),
        });

        return block;
      })
    );
  });
}

export default class Unspents {
  @observable
  public list: Array<UnspentWithTx> = observable.array([]);

  @observable
  private latestBlock: number;

  constructor(private bridge: Bridge, private account: Account) {
    reaction(() => this.account.address, this.clearUnspents);
    reaction(() => this.account.address, this.fetchUnspents);
    reaction(
      () => bridge.events,
      () => {
        bridge.events.on('NewDeposit', this.fetchUnspents);
        bridge.events.on('ExitStarted', this.fetchUnspents);
      }
    );
    setInterval(this.fetchUnspents, 5000);
  }

  @computed
  public get periodBlocksRange() {
    if (this.latestBlock) {
      return [
        Math.floor(this.latestBlock / 32) * 32,
        Math.ceil(this.latestBlock / 32) * 32,
      ];
    }

    return undefined;
  }

  @autobind
  private clearUnspents() {
    this.list = observable.array([]);
    this.latestBlock = undefined;
  }

  @autobind
  private fetchUnspents() {
    // ToDo: fix typing in lib
    const eth = (pWeb3 as any).eth as Eth;

    if (this.account.address) {
      eth.getBlockNumber().then(blockNumber => {
        if (this.latestBlock !== blockNumber) {
          this.latestBlock = blockNumber;
          pWeb3
            .getUnspent(this.account.address)
            .then(unspent => {
              return Promise.all(
                unspent.map(u =>
                  eth.getTransaction(ethUtil.bufferToHex(u.outpoint.hash))
                )
              ).then(transactions => {
                transactions.forEach((tx, i) => {
                  (unspent[
                    i
                  ] as UnspentWithTx).transaction = tx as ParsecTransaction;
                });

                return unspent as UnspentWithTx[];
              });
            })
            .then(unspent => {
              this.list = observable.array(unspent);
            });
        }
      });
    }
  }

  @autobind
  public exitUnspent(i) {
    const u = this.list[i];
    const { blockNumber, raw } = u.transaction;
    const periodNumber = Math.floor(blockNumber / 32);
    const startBlock = periodNumber * 32;
    const endBlock = periodNumber * 32 + 32;
    makePeriodFromRange(startBlock, endBlock).then(period =>
      this.bridge.startExit(period.proof(Tx.fromRaw(raw)), u.outpoint.index)
    );
  }
}
