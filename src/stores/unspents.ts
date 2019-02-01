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

import { CONFIG } from '../config';
import { add, bi, ZERO } from 'jsbi-utils';
import ExitHandler from './exitHandler';
import Bridge from './bridge';
import Operator from './operator';
import Account from './account';
import NodeStore from './node';
import Web3Store from './web3/';
import Tokens from './tokens';
import storage from '../utils/storage';

const { periodBlockRange, getYoungestInputTx, getProof } = helpers;

type UnspentWithTx = Unspent & { 
  transaction: LeapTransaction,
  pendingFastExit?: boolean,
};

const objectify = (unspent: UnspentWithTx): UnspentWithTx => {
  if (!unspent.outpoint.toJSON) {
    unspent.outpoint = Outpoint.fromJSON(unspent.outpoint as any as OutpointJSON);
  }
  return unspent;
};

export default class Unspents {
  @observable
  public list: Array<UnspentWithTx> = observable.array([]);

  @observable
  private latestBlock: number;

  @observable
  public pendingFastExits: {};

  constructor(
    private exitHandler: ExitHandler,
    bridge: Bridge,
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
    reaction(
      () => bridge.events,
      () => {
        bridge.events.on('NewHeight', this.finalizeFastExits);
      }
    );
    reaction(() => this.node.latestBlock, this.fetchUnspents);
    when(() => (this.latestBlock && !!this.operator.slots[0]), () => this.finalizeFastExits({}));
    
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

  private postData(url = '', data = {}) {
    // Default options are marked with *
      return fetch(url, {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, cors, *same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          headers: {
              "Content-Type": "application/json",
          },
          redirect: "error", // manual, *follow, error
          referrer: "no-referrer", // no-referrer, *client
          body: JSON.stringify(data), // body data type must match "Content-Type" header
      })
      .then(response => response.json()); // parses response to JSON
  }

  @autobind
  private finalizeFastExits(period) {
    console.log('period received', period);
    if (Object.keys(this.pendingFastExits).length < 1) return;
    Object.values(this.pendingFastExits)
      .filter((e:any) => e.effectiveBlock < this.periodBlocksRange[1] && e.sig !== '')
      .forEach(this.finalizeFastExit.bind(this));
  }

  @autobind
  private finalizeFastExit(exit) {
    console.log('Finalizing fast exit', exit, this.operator.slots);
    const { signer } = this.operator.slots[0];
    const { unspent, sig, rawTx, sigHashBuff } = exit;
    const vBuff = Buffer.alloc(32);
    vBuff.writeInt8(sig.v, 31);
    const signedData = Exit.bufferToBytes32Array(
      Buffer.concat([toBuffer(sigHashBuff), Buffer.from(sig.r), Buffer.from(sig.s), vBuff])
    );
    return Promise.all([
      getProof(this.web3.plasma.instance, rawTx, 0, signer),
      getProof(this.web3.plasma.instance, unspent.transaction, 0, signer),
      0,
      signedData
    ]).then(([txProof, inputProof, inputIndex, signedData]) => {
      //call api
      this.postData(CONFIG.exitMarketMaker, {
        inputProof: inputProof,
        transferProof: txProof,
        inputIndex: inputIndex,
        outputIndex: 0,    // output of spending tx that we want to exit
        signedData: signedData
      }).then(rsp => {
        console.log(rsp);
        delete this.pendingFastExits[bufferToHex(unspent.outpoint.hash)];
        this.storePendingFastExits();
      }).catch(err => {
        console.log(err);
      });
    });
  }

  @autobind
  public fastExitUnspent(unspent: UnspentWithTx) {
    unspent = objectify(unspent);

    const token = this.tokens.tokenForColor(unspent.output.color);

    const amount = bi(unspent.output.value);

    let tx, sigHashBuff, rawTx;

    const unspentHash = bufferToHex(unspent.outpoint.hash);
    return token.transfer(this.exitHandler.address, amount)
    .then(data => data.futureReceipt)
    .then(txObj => {
      rawTx = txObj;
      tx = Tx.fromRaw(txObj.raw);
      const utxoId = (new Outpoint(tx.hash(), 0)).getUtxoId();
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
    return Tx.signMessageWithWeb3(this.web3.injected.instance, sigHashBuff)
      .then(sig => {
        this.pendingFastExits[unspentHash].sig = sig;
        this.storePendingFastExits();
      });
  }

  public listForColor(color: number) {
    return this.list.filter(u => u.output.color === color).concat(
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
