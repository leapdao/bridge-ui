/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import {
  observable,
  reaction,
  computed,
  autorun,
  IObservableArray,
} from 'mobx';
import {
  Unspent,
  Tx,
  Outpoint,
  OutpointJSON,
  Type,
  LeapTransaction,
  helpers,
  Period,
  Exit,
  PeriodData,
} from 'leap-core';
import { bufferToHex } from 'ethereumjs-util';
import autobind from 'autobind-decorator';

import { CONFIG } from '../config';
import storage from '../utils/storage';
import { accountStore } from './account';
import { exitHandlerStore } from './exitHandler';
import { nodeStore } from './node';
import { operatorStore } from './operator';
import { web3PlasmaStore } from './web3/plasma';
import { web3InjectedStore } from './web3/injected';

const { getYoungestInputTx, getProof } = helpers;

type UnspentWithTx = Unspent & {
  transaction: LeapTransaction;
  pendingFastExit?: boolean;
};

const objectify = (outpoint: Outpoint): Outpoint => {
  if (!outpoint.toJSON) {
    return Outpoint.fromJSON((outpoint as any) as OutpointJSON);
  }
  return outpoint;
};

export class UnspentsStore {
  @observable
  public list: IObservableArray<UnspentWithTx> = observable.array([]);

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
    reaction(() => nodeStore.latestBlock, this.fetchUnspents);

    this.pendingFastExits = storage.load('pendingFastExits');
    autorun(this.storePendingFastExits);
  }

  @autobind
  private storePendingFastExits() {
    storage.store('pendingFastExits', this.pendingFastExits);
  }

  @computed
  public get periodBlocksRange() {
    if (this.latestBlock) {
      return Period.periodBlockRange(this.latestBlock);
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

  private exitDeposit(
    unspentDeposit: UnspentWithTx,
    fallbackPeriodData: PeriodData
  ) {
    return getProof(
      web3PlasmaStore.instance,
      unspentDeposit.transaction,
      fallbackPeriodData
    ).then(txProof =>
      exitHandlerStore.startExit([], txProof, unspentDeposit.outpoint.index, 0)
    );
  }

  @autobind
  public exitUnspent(unspent: UnspentWithTx) {
    const tx = Tx.fromRaw(unspent.transaction.raw);

    const { signer } = operatorStore.slots[0];

    const fallbackPeriodData = { slotId: 0, validatorAddress: signer };

    if (tx.type === Type.DEPOSIT) {
      return this.exitDeposit(unspent, fallbackPeriodData);
    }

    getYoungestInputTx(web3PlasmaStore.instance, tx)
      .then(inputTx =>
        Promise.all([
          getProof(
            web3PlasmaStore.instance,
            unspent.transaction,
            fallbackPeriodData
          ),
          getProof(web3PlasmaStore.instance, inputTx.tx, fallbackPeriodData),
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

  @autobind
  public fastExitUnspent(unspent: UnspentWithTx) {
    const outpoint = objectify(unspent.outpoint);

    const exitingUtxoId = outpoint.hex();

    return (Exit.fastSellUTXO(
      unspent,
      web3PlasmaStore.instance,
      web3InjectedStore.instance,
      CONFIG.exitMarketMaker
    ) as any)
      .on('transfer', fastSellRequest => {
        this.list.remove(unspent);
        this.pendingFastExits[exitingUtxoId] = {
          ...fastSellRequest,
          unspent,
        };
      })
      .then(() => {
        delete this.pendingFastExits[exitingUtxoId];
      });
  }

  public signFastExit(unspent: UnspentWithTx) {
    const exitingUtxoId = objectify(unspent.outpoint).hex();
    const fastSellRequest = this.pendingFastExits[exitingUtxoId];
    fastSellRequest.sigHashBuff = Buffer.from(fastSellRequest.sigHashBuff);
    return Exit.signAndSendFastSellRequest(
      fastSellRequest,
      web3InjectedStore.instance,
      CONFIG.exitMarketMaker
    ).then(() => {
      delete this.pendingFastExits[exitingUtxoId];
    });
  }

  public listForColor(color: number) {
    return this.list
      .filter(u => u.output.color === color)
      .concat(
        Object.values(this.pendingFastExits)
          .filter((v: any) => v.unspent.transaction.color === color)
          .map((v: any) => ({
            ...v.unspent,
            outpoint: objectify(v.unspent.outpoint),
            pendingFastExit: true,
          }))
      );
  }

  @autobind
  public consolidate(color: number) {
    Tx.consolidateUTXOs(this.listForColor(color)).forEach(tx =>
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
