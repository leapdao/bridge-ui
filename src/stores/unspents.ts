/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, reaction, computed } from 'mobx';
import {
  Unspent,
  Tx,
  Period,
  Block,
  Input,
  Output,
  Type,
  ExtendedWeb3,
} from 'leap-core';
import { Transaction } from 'web3/eth/types';
import { bufferToHex } from 'ethereumjs-util';

import ExitHandler from './exitHandler';
import Account from './account';
import autobind from 'autobind-decorator';
import { range } from '../utils/range';
import NodeStore from './node';
import Web3Store from './web3';

interface PlasmaTransaction extends Transaction {
  raw: string;
}

type UnspentWithTx = Unspent & { transaction: PlasmaTransaction };

function makePeriodFromRange(plasma: ExtendedWeb3, startBlock, endBlock) {
  // ToDo: fix typing in lib
  return Promise.all(
    range(startBlock, endBlock - 1).map(n => plasma.eth.getBlock(n, true))
  ).then(blocks => {
    return new Period(
      null,
      blocks.filter(a => !!a).map(({ number, timestamp, transactions }) => {
        const block = new Block(number, {
          timestamp,
          txs: transactions.map((tx: PlasmaTransaction) => Tx.fromRaw(tx.raw)),
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

  constructor(
    private exitHandler: ExitHandler,
    private account: Account,
    private node: NodeStore,
    private web3: Web3Store
  ) {
    reaction(() => this.account.address, this.clearUnspents);
    reaction(() => this.account.address, this.fetchUnspents);
    reaction(
      () => exitHandler.events,
      () => {
        exitHandler.events.on('NewDeposit', this.fetchUnspents);
        exitHandler.events.on('ExitStarted', this.fetchUnspents);
      }
    );
    reaction(() => this.node.latestBlock, this.fetchUnspents);
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
    if (this.account.address) {
      if (this.latestBlock !== this.node.latestBlock) {
        this.latestBlock = this.node.latestBlock;
        this.web3.plasma
          .getUnspent(this.account.address)
          .then(unspent => {
            return Promise.all(
              unspent.map(u =>
                this.web3.plasma.eth.getTransaction(
                  bufferToHex(u.outpoint.hash)
                )
              )
            ).then(transactions => {
              transactions.forEach((tx, i) => {
                (unspent[
                  i
                ] as UnspentWithTx).transaction = tx as PlasmaTransaction;
              });

              return unspent as UnspentWithTx[];
            });
          })
          .then(unspent => {
            this.list = observable.array(unspent);
          });
      }
    }
  }

  @autobind
  public exitUnspent(unspent: UnspentWithTx) {
    const { blockNumber, raw } = unspent.transaction;
    const periodNumber = Math.floor(blockNumber / 32);
    const startBlock = periodNumber * 32;
    const endBlock = periodNumber * 32 + 32;
    makePeriodFromRange(this.web3.plasma, startBlock, endBlock).then(period =>
      this.exitHandler.startExit(
        period.proof(Tx.fromRaw(raw)),
        unspent.outpoint.index
      )
    );
  }

  public listForColor(color: number) {
    return this.list.filter(u => u.output.color === color);
  }

  @autobind
  public consolidate(color: number) {
    const list = this.listForColor(color);
    const chunks = list.reduce(
      (acc, u) => {
        const currentChunk = acc[acc.length - 1];
        currentChunk.push(u);
        if (currentChunk.length === 15) {
          acc.push([] as UnspentWithTx[]);
        }

        return acc;
      },
      [[]] as UnspentWithTx[][]
    );

    const consolidates = chunks.reduce(
      (txs, chunk) => {
        const inputs = chunk.reduce(
          (inputs, u) => {
            const index = inputs.findIndex(
              input =>
                input.prevout.hash.compare(u.outpoint.hash) === 0 &&
                input.prevout.index === u.outpoint.index
            );

            if (index === -1) {
              inputs.push(new Input(u.outpoint));
            }

            return inputs;
          },
          [] as Input[]
        );
        const value = chunk.reduce((v, u) => v + Number(u.output.value), 0);
        txs.push(
          Tx.consolidate(
            inputs,
            new Output(value, this.account.address, Number(color))
          )
        );
        return txs;
      },
      [] as Array<Tx<Type.CONSOLIDATE>>
    );

    consolidates.forEach(consolidate => {
      this.web3.plasma.eth.sendSignedTransaction(consolidate.toRaw() as any);
    });
  }
}
