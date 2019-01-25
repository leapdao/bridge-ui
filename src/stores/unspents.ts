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

import ExitHandler from './exitHandler';
import Account from './account';
import autobind from 'autobind-decorator';
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

  private exitDeposit(unspentDeposit: UnspentWithTx) {
    return this.web3.plasma.instance.getValidatorInfo().then(validatorInfo => {
      return getProof(
        this.web3.plasma.instance, 
        unspentDeposit.transaction,
        0, // TODO: get this some-how
        validatorInfo.ethAddress
      )
    }).then(txProof =>
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

    if (tx.type === Type.DEPOSIT) {
      return this.exitDeposit(unspent)
    }
    Promise.all([
      getYoungestInputTx(this.web3.plasma.instance, tx),
      this.web3.plasma.instance.getValidatorInfo(),
    ]).then(([inputTx, validatorInfo]) =>
      Promise.all([
        getProof(this.web3.plasma.instance, unspent.transaction, 0, validatorInfo.ethAddress),
        getProof(this.web3.plasma.instance, inputTx.tx, 0, validatorInfo.ethAddress),
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
      this.web3.plasma.instance.eth.sendSignedTransaction(consolidate.hex() as any);
    });
  }
}
