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
  Input,
  Output,
  Type,
  LeapTransaction,
  helpers,
} from 'leap-core';
import { bufferToHex } from 'ethereumjs-util';
import autobind from 'autobind-decorator';

import { add, bi, ZERO } from 'jsbi-utils';
import ExitHandler from './exitHandler';
import Operator from './operator';
import Account from './account';
import NodeStore from './node';
import Web3Store from './web3/';

const { periodBlockRange, getYoungestInputTx, getProof } = helpers;

type UnspentWithTx = Unspent & { transaction: LeapTransaction };


export default class Unspents {
  @observable
  public list: Array<UnspentWithTx> = observable.array([]);

  @observable
  private latestBlock: number;

  constructor(
    private exitHandler: ExitHandler,
    private operator: Operator,
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

  private exitDeposit(unspentDeposit: UnspentWithTx, signer: string) {
    return getProof(
      this.web3.plasma.instance, 
      unspentDeposit.transaction,
      0, // TODO: get this some-how
      signer
    ).then(txProof =>
      this.exitHandler.startExit(
        [],
        txProof,
        unspentDeposit.outpoint.index,
        0,
      )
    );
  }

  @autobind
  public exitUnspent(unspent: UnspentWithTx) {
    const tx = Tx.fromRaw(unspent.transaction.raw);

    const { signer } = this.operator.slots[0];

    if (tx.type === Type.DEPOSIT) {
      return this.exitDeposit(unspent, signer)
    }

    getYoungestInputTx(
      this.web3.plasma.instance, tx
    ).then((inputTx) => 
      Promise.all([
        getProof(this.web3.plasma.instance, unspent.transaction, 0, signer),
        getProof(this.web3.plasma.instance, inputTx.tx, 0, signer),
        inputTx.index,
      ])
    ).then(([txProof, inputProof, inputIndex]) =>
      this.exitHandler.startExit(
        inputProof,
        txProof,
        unspent.outpoint.index,
        inputIndex,
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
        const value = chunk.reduce((v, u) => add(v, bi(u.output.value)), ZERO);
        txs.push(
          Tx.transfer(
            inputs,
            [new Output(value, this.account.address, Number(color))]
          )
        );
        return txs;
      },
      [] as Array<Tx<Type.TRANSFER>>
    );

    consolidates.forEach(tx =>
      tx.signWeb3(this.web3.injected.instance as any)
        .then(signedTx => 
          this.web3.plasma.instance.eth.sendSignedTransaction(signedTx.hex() as any)
        )
    );
  }
}
