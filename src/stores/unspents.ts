/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, reaction, computed } from 'mobx';
import axios from 'axios';
import {
  Unspent,
  Tx,
  Input,
  Output,
  Type,
  LeapTransaction,
  helpers,
  Exit
} from 'leap-core';
import { bufferToHex } from 'ethereumjs-util';
import autobind from 'autobind-decorator';

import { CONFIG } from '../config';
import { add, bi, ZERO } from 'jsbi-utils';
import ExitHandler from './exitHandler';
import Operator from './operator';
import Account from './account';
import NodeStore from './node';
import Web3Store from './web3/';
import Tokens from './tokens';

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
    private web3: Web3Store,
    private tokens: Tokens
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

  @autobind
  public fastExitUnspent(unspent: UnspentWithTx) {
    const tx = Tx.fromRaw(unspent.transaction.raw);

    const utxoId = unspent.outpoint.getUtxoId();
    const amount = bi(unspent.output.value);
    const sigHashBuff = Exit.sigHashBuff(utxoId, amount);

    const { signer } = this.operator.slots[0];

    const token = this.tokens.tokenForColor(unspent.output.color);

    this.myUnspentAtExitHandler();

    return token.transfer(this.exitHandler.address, bi(unspent.output.value)).then(data => {
      
    })


    // return Tx.signMessageWithWeb3(this.web3.injected.instance, sigHashBuff.toString('hex')).then(sig => {
    //   const vBuff = Buffer.alloc(32);
    //   vBuff.writeInt8(sig.v, 31);
    //   return Buffer.concat([sigHashBuff, Buffer.from(sig.r), Buffer.from(sig.s), vBuff]);
    // }).then(signedData => 
    //   Promise.all([
    //     getYoungestInputTx(this.web3.plasma.instance, tx),
    //     Exit.bufferToBytes32Array(signedData),
    //   ])
    // ).then(([inputTx, signedData]) => {
    //   console.log(inputTx);
    //   return Promise.all([
    //     getProof(this.web3.plasma.instance, unspent.transaction, 0, signer),
    //     getProof(this.web3.plasma.instance, inputTx.tx, 0, signer),
    //     inputTx.index,
    //     signedData
    //   ])
    // }).then(([txProof, inputProof, inputIndex, signedData]) => {
    //   //call api
    //   console.log([txProof, inputProof, inputIndex, signedData]);
    //   console.log(CONFIG);
    //   axios.request({
    //     url: CONFIG.exitMarketMaker,
    //     data: {
    //       inputProof: inputProof,
    //       transferProof: txProof,
    //       inputIndex: inputIndex,
    //       outputIndex: unspent.outpoint.index,
    //       signedData: signedData
    //     },
    //     headers: {
    //       'Content-Type': 'application/json'
    //     },
    //     method: 'post'
    //   })
    //   .then(function (response) {
    //     console.log(response);
    //   })
    //   .catch(function (error) {
    //     console.log(error);
    //   });
    // });
  }

  private myUnspentAtExitHandler() {
    this.web3.plasma.instance
      .getUnspent(this.exitHandler.address)
      .then((unspent: UnspentWithTx[]) => {
        return Promise.all(
          unspent
          .map((u : UnspentWithTx) =>
            this.web3.plasma.instance.eth.getTransaction(
              bufferToHex(u.outpoint.hash)
            ).then((tx: LeapTransaction) => {
              u.transaction = tx;
              return u;
            })
          )
        )
      }).then(us => {
        const myUs = us.filter(u => u.transaction.from == this.account.address)
        console.log(myUs)
      })
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
