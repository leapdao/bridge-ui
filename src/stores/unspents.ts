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
  LeapTransaction,
} from 'leap-core';
import { bufferToHex } from 'ethereumjs-util';

import ExitHandler from './exitHandler';
import Account from './account';
import autobind from 'autobind-decorator';
import { range, BLOCKS_PER_PERIOD } from '../utils';
import NodeStore from './node';
import Web3Store from './web3/';

type UnspentWithTx = Unspent & { transaction: LeapTransaction };

const periodBlockRange = blockNumber =>
  [
    Math.floor(blockNumber / BLOCKS_PER_PERIOD) * BLOCKS_PER_PERIOD,
    Math.ceil(blockNumber / BLOCKS_PER_PERIOD) * BLOCKS_PER_PERIOD,
  ];

const periodForBlockRange = (plasma: ExtendedWeb3, startBlock, endBlock) => {
  // ToDo: fix typing in lib
  return Promise.all(
    range(startBlock, endBlock - 1).map(n => plasma.eth.getBlock(n, true))
  ).then(blocks => {
    const blockList = blocks
      .filter(a => !!a)
      .map(({ number, timestamp, transactions }) => 
        Block.from(number, timestamp, transactions as LeapTransaction[])
      );
    return new Period(null, blockList);
  });
}

const periodForTx = (plasma: ExtendedWeb3, tx: LeapTransaction) => {
  const { blockNumber } = tx;
  const [startBlock, endBlock] = periodBlockRange(blockNumber);
  return periodForBlockRange(plasma, startBlock, endBlock);
};

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
      return periodBlockRange(this.latestBlock);
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
    
    if (!this.account.address || this.latestBlock === this.node.latestBlock) {
      return;
    }

    this.latestBlock = this.node.latestBlock;
    this.web3.plasma.instance
      .getUnspent(this.account.address)
      .then((unspent: UnspentWithTx[]) => {
        return Promise.all(
          unspent.map((u : UnspentWithTx) =>
            this.web3.plasma.instance.eth.getTransaction(
              bufferToHex(u.outpoint.hash)
            ).then((tx: LeapTransaction) => {
              u.transaction = tx;
              return u;
            })
          )
        )
      }).then((unspent: UnspentWithTx[]) => {
        this.list = observable.array(unspent);
      });
  }

  @autobind
  public exitUnspent(unspent: UnspentWithTx) {
    periodForTx(this.web3.plasma.instance, unspent.transaction).then(period =>
      this.exitHandler.startExit(
        period.proof(Tx.fromRaw(unspent.transaction.raw)),
        unspent.outpoint.index,
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
      this.web3.plasma.instance.eth.sendSignedTransaction(consolidate.toRaw() as any);
    });
  }
}
