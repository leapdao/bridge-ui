/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, reaction, computed, when } from 'mobx';
import {
  Unspent,
  Tx,
  Input,
  Output,
  Outpoint,
  OutpointJSON,
  Type,
  LeapTransaction,
  helpers,
  Exit,
} from 'leap-core';
import { bufferToHex, toBuffer } from 'ethereumjs-util';
import autobind from 'autobind-decorator';
import { add, bi, ZERO } from 'jsbi-utils';

import { CONFIG } from '../config';
import storage from '../utils/storage';
import { accountStore } from './account';
import { exitHandlerStore } from './exitHandler';
import { bridgeStore } from './bridge';
import { nodeStore } from './node';
import { operatorStore } from './operator';
import { web3PlasmaStore } from './web3/plasma';
import { tokensStore } from './tokens';
import { web3InjectedStore } from './web3/injected';

const { periodBlockRange, getYoungestInputTx, getProof } = helpers;

type UnspentWithTx = Unspent & {
  transaction: LeapTransaction;
  pendingFastExit?: boolean;
};

const objectify = (unspent: UnspentWithTx): UnspentWithTx => {
  if (!unspent.outpoint.toJSON) {
    unspent.outpoint = Outpoint.fromJSON(
      (unspent.outpoint as any) as OutpointJSON
    );
  }
  return unspent;
};

export class UnspentsStore {
  @observable
  public list: UnspentWithTx[] = observable.array([]);

  @observable
  public pendingFastExits: {};

  @observable
  private latestBlock: number;

  constructor() {
    reaction(() => accountStore.address, this.clearUnspents);
    reaction(() => accountStore.address, this.fetchUnspents);
    reaction(
      () => exitHandlerStore.contract,
      () => {
        exitHandlerStore.contract.events.NewDeposit({}, this.fetchUnspents);
        exitHandlerStore.contract.events.ExitStarted({}, this.fetchUnspents);
      }
    );
    reaction(
      () => bridgeStore.contract,
      () => {
        bridgeStore.contract.events.NewHeight({}, this.finalizeFastExits);
      }
    );
    reaction(() => nodeStore.latestBlock, this.fetchUnspents);
    when(
      () => this.latestBlock && !!operatorStore.slots[0],
      () => this.finalizeFastExits(null, {})
    );

    this.pendingFastExits = storage.load('pendingFastExits');
  }

  private storePendingFastExits() {
    storage.store('pendingFastExits', this.pendingFastExits);
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
    if (!accountStore.address || this.latestBlock === nodeStore.latestBlock) {
      return;
    }

    this.latestBlock = nodeStore.latestBlock;
    web3PlasmaStore.instance
      .getUnspent(accountStore.address)
      .then((unspent: UnspentWithTx[]) => {
        return Promise.all(
          unspent.map((u: UnspentWithTx) =>
            web3PlasmaStore.instance.eth
              .getTransaction(bufferToHex(u.outpoint.hash))
              .then((tx: LeapTransaction) => {
                u.transaction = tx;
                return u;
              })
          )
        );
      })
      .then((unspent: UnspentWithTx[]) => {
        this.list = observable.array(unspent);
      });
  }

  private exitDeposit(unspentDeposit: UnspentWithTx, signer: string) {
    return getProof(
      web3PlasmaStore.instance,
      unspentDeposit.transaction,
      0, // TODO: get this some-how
      signer
    ).then(txProof =>
      exitHandlerStore.startExit([], txProof, unspentDeposit.outpoint.index, 0)
    );
  }

  @autobind
  public exitUnspent(unspent: UnspentWithTx) {
    const tx = Tx.fromRaw(unspent.transaction.raw);

    const { signer } = operatorStore.slots[0];

    if (tx.type === Type.DEPOSIT) {
      return this.exitDeposit(unspent, signer);
    }

    getYoungestInputTx(web3PlasmaStore.instance, tx)
      .then(inputTx =>
        Promise.all([
          getProof(web3PlasmaStore.instance, unspent.transaction, 0, signer),
          getProof(web3PlasmaStore.instance, inputTx.tx, 0, signer),
          inputTx.index,
        ])
      )
      .then(([txProof, inputProof, inputIndex]) =>
        exitHandlerStore.startExit(
          inputProof,
          txProof,
          unspent.outpoint.index,
          inputIndex
        )
      );
  }

  private postData(url = '', data = {}) {
    // Default options are marked with *
    return fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, cors, *same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'error', // manual, *follow, error
      referrer: 'no-referrer', // no-referrer, *client
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    }).then(response => response.json()); // parses response to JSON
  }

  @autobind
  private finalizeFastExits(_, period) {
    console.log('period received', period);
    if (Object.keys(this.pendingFastExits).length < 1) {
      return;
    }
    Object.values(this.pendingFastExits)
      .filter(
        (e: any) => e.effectiveBlock < this.periodBlocksRange[1] && e.sig !== ''
      )
      .forEach(this.finalizeFastExit.bind(this));
  }

  @autobind
  private finalizeFastExit(exit) {
    console.log('Finalizing fast exit', exit, operatorStore.slots);
    const { signer } = operatorStore.slots[0];
    const { unspent, sig, rawTx, sigHashBuff } = exit;
    const vBuff = Buffer.alloc(32);
    vBuff.writeInt8(sig.v, 31);
    const signedData = Exit.bufferToBytes32Array(
      Buffer.concat([
        toBuffer(sigHashBuff),
        Buffer.from(sig.r),
        Buffer.from(sig.s),
        vBuff,
      ])
    );
    return Promise.all([
      getProof(web3PlasmaStore.instance, rawTx, 0, signer),
      getProof(web3PlasmaStore.instance, unspent.transaction, 0, signer),
      0,
    ]).then(([txProof, inputProof, inputIndex]) => {
      // call api
      this.postData(CONFIG.exitMarketMaker, {
        inputProof,
        transferProof: txProof,
        inputIndex,
        outputIndex: 0, // output of spending tx that we want to exit
        signedData,
      })
        .then(rsp => {
          console.log(rsp);
          delete this.pendingFastExits[bufferToHex(unspent.outpoint.hash)];
          this.storePendingFastExits();
        })
        .catch(err => {
          console.log(err);
        });
    });
  }

  @autobind
  public fastExitUnspent(unspent: UnspentWithTx) {
    unspent = objectify(unspent);

    const token = tokensStore.tokenForColor(unspent.output.color);

    const amount = bi(unspent.output.value);

    let tx;
    let sigHashBuff;
    let rawTx;

    const unspentHash = bufferToHex(unspent.outpoint.hash);
    return token
      .transfer(exitHandlerStore.address, amount)
      .then(data => data.futureReceipt)
      .then(txObj => {
        rawTx = txObj;
        tx = Tx.fromRaw(txObj.raw);
        const utxoId = new Outpoint(tx.hash(), 0).getUtxoId();
        sigHashBuff = Exit.sigHashBuff(utxoId, amount);

        // create pending exit after the first sig, so that we can continue
        // the process if the user mistakingly rejects the second sig or closes the browser
        this.pendingFastExits[unspentHash] = {
          unspent,
          sig: '',
          rawTx,
          effectiveBlock: periodBlockRange(rawTx.blockNumber)[1],
          sigHashBuff: `0x${sigHashBuff.toString('hex')}`,
        };
        this.storePendingFastExits();
        return this.signFastExit(unspent);
      });
  }

  public signFastExit(unspent: UnspentWithTx) {
    const unspentHash = bufferToHex(unspent.outpoint.hash);
    const sigHashBuff = this.pendingFastExits[unspentHash].sigHashBuff;
    return Tx.signMessageWithWeb3(web3InjectedStore.instance, sigHashBuff).then(
      sig => {
        this.pendingFastExits[unspentHash].sig = sig;
        this.storePendingFastExits();
      }
    );
  }

  public listForColor(color: number) {
    return this.list
      .filter(u => u.output.color === color)
      .concat(
        Object.values(this.pendingFastExits)
          .filter((v: any) => v.unspent.transaction.color === color)
          .map((v: any) => ({ ...objectify(v.unspent), pendingFastExit: true }))
      );
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
          (acc, u) => {
            const index = acc.findIndex(
              input =>
                input.prevout.hash.compare(u.outpoint.hash) === 0 &&
                input.prevout.index === u.outpoint.index
            );

            if (index === -1) {
              acc.push(new Input(u.outpoint));
            }

            return acc;
          },
          [] as Input[]
        );
        const value = chunk.reduce((v, u) => add(v, bi(u.output.value)), ZERO);
        txs.push(
          Tx.transfer(inputs, [
            new Output(value, accountStore.address, Number(color)),
          ])
        );
        return txs;
      },
      [] as Array<Tx<Type.TRANSFER>>
    );

    consolidates.forEach(tx =>
      tx
        .signWeb3(web3InjectedStore.instance as any)
        .then(signedTx =>
          web3PlasmaStore.instance.eth.sendSignedTransaction(
            signedTx.hex() as any
          )
        )
    );
  }
}

export const unspentsStore = new UnspentsStore();
