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
  Outpoint,
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
import Bridge from './bridge';
import Operator from './operator';
import Account from './account';
import NodeStore from './node';
import Web3Store from './web3/';
import Tokens from './tokens';

const { periodBlockRange, getYoungestInputTx, getProof } = helpers;

type UnspentWithTx = Unspent & { transaction: LeapTransaction };

const mockData = {"inputProof": [ '0x4aa9b4b4865c3be688596e7dce7fe90da43126c702030bc3f32d838d7318158e', '0x4607009a00000000000000140000000000000000000000000000000000000000', '0x00000000000003116909fc793c3afda9c5ce749902115273ceef9a80a8cded3d', '0x9221aa6e5d2b87fe0023903ecfbac0635ae8823e40ae6d2fe696b6813ad4911b', '0x9e94649e6716557dee378c5586af598907c6730ab0c0af102f908fffbca4c078', '0x02e082c76cf528c78e1b00000000000000000000000000000000000000000000', '0x0001c9f78d2893e40000000083b3525e17f9eaa92dae3f9924cc333c94c7e98a', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x9f7b39864833cad4e2a4a65139e5a17b6b0341e2a3f89e1c48216730edf91fa1', '0xca112e33afcdf858b66f4103d33203f46e31408a46ddbce71ac9d0ae80dae5cd', '0x18bc9030ae2b9584a8ea298de2ff560f75e991f8d004204c387a7326b2412ad7', '0x315be4faecc52c10016ecd9fe9095d868ac4139fe7ef4eddd7bb55367ff15739' ], "transferProof": [ '0x4aa9b4b4865c3be688596e7dce7fe90da43126c702030bc3f32d838d7318158e', '0x300800d00000000000000018000000000312aa5b08de7a9454faa07856597f36', '0x6a73d1bbe19ae43f17a81a15f52b6b500a8400b4edcff140e47a859ee8434eee', '0xd76441a92e9371c6b76e2adb2b56fe86a57fcc190198311c3b4a8c112dc5fb70', '0x6ec42b20ed7bed6bac0b6364aecfd36d5a93361b000000000000000000000000', '0x0000000000000000000000008ac7230489e80000000054177ded16b8fe8f9017', '0xd6c44704f6998a914e5400000000000000000000000000000000000000000000', '0x00013f306a2409fc0000000083b3525e17f9eaa92dae3f9924cc333c94c7e98a', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000000000000000000000000000', '0xf594e47d692eeb3844e507734d2cf40b942195de76bc8f3aad57c550f337e4af', '0xd09c9cd0ade47bc24745cb0d8d8c0df00c17003d6db30a22bda86799733dfd80', '0x18bc9030ae2b9584a8ea298de2ff560f75e991f8d004204c387a7326b2412ad7', '0x315be4faecc52c10016ecd9fe9095d868ac4139fe7ef4eddd7bb55367ff15739' ], "outputIndex": 0, "inputIndex": 0, "signedData": ['0x00000000000000000000000000000000009a53fba464ea4e1d3d4a7fabf5b25a', '0x0000000000000000000000000000000000000000000000008ac7230489e80000', '0x724a915adb5c84b4b22a93c45c14d709ab9d16a3d4572e98d00980c46668d843', '0x789ea187c5f8fa33ac4ca938e3f44de92bff4f76b660064a2b96b8ff250f779d', '0x000000000000000000000000000000000000000000000000000000000000001b']};

const pendingFastExits = [];

export default class Unspents {
  @observable
  public list: Array<UnspentWithTx> = observable.array([]);

  @observable
  private latestBlock: number;

  constructor(
    private exitHandler: ExitHandler,
    private bridge: Bridge,
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
        bridge.events.on('NewHeight', this.finalizeFastExit);
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
  private finalizeFastExit(period) {
    if (pendingFastExits.length < 1) {
      return;
    }
    const { signer } = this.operator.slots[0];
    const [{unspent, sig, rawTx, sigHashBuff}] = pendingFastExits;
    const vBuff = Buffer.alloc(32);
    vBuff.writeInt8(sig.v, 31);
    const signedData = Exit.bufferToBytes32Array(
      Buffer.concat([sigHashBuff, Buffer.from(sig.r), Buffer.from(sig.s), vBuff])
    );
    return Promise.all([
      getProof(this.web3.plasma.instance, rawTx, 0, signer),
      getProof(this.web3.plasma.instance, unspent.transaction, 0, signer),
      0,
      signedData
    ]).then(([txProof, inputProof, inputIndex, signedData]) => {
      pendingFastExits.shift();
      //call api
      this.postData(CONFIG.exitMarketMaker, {
        inputProof: inputProof,
        transferProof: txProof,
        inputIndex: inputIndex,
        outputIndex: 0,    // output of spending tx that we want to exit
        signedData: signedData
      }).then(rsp => {
        console.log(rsp);
      }).catch(err => {
        console.log(err);
      });
    });
  }

  @autobind
  public fastExitUnspent(unspent: UnspentWithTx) {

    const token = this.tokens.tokenForColor(unspent.output.color);

    const amount = bi(unspent.output.value);

    let tx, sigHashBuff, rawTx;

    return token.transfer(this.exitHandler.address, amount)
    .then(data => data.futureReceipt)
    .then(txObj => {
      rawTx = txObj;
      tx = Tx.fromRaw(txObj.raw);
      const utxoId = (new Outpoint(tx.hash(), 0)).getUtxoId();
      sigHashBuff = Exit.sigHashBuff(utxoId, amount);
      return Tx.signMessageWithWeb3(this.web3.injected.instance, `0x${sigHashBuff.toString('hex')}`);
    }).then(sig => {
      // keep the sig around
      pendingFastExits.push({
        unspent,
        sig,
        rawTx,
        sigHashBuff,
      });
    });
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
