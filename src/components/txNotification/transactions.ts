/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { action, observable, ObservableMap, runInAction } from 'mobx';
import autobind from 'autobind-decorator';
import { TxStatus, DetailedInflightTxReceipt } from './types';

export default class Transactions {
  @observable
  public map: ObservableMap<string, DetailedInflightTxReceipt>;

  constructor() {
    this.map = observable.map({});
  }

  @autobind
  @action
  public update(newTx: DetailedInflightTxReceipt) {
    const oldTx = this.map.get(newTx.key) || {
      key: newTx.key,
      futureReceipt: null,
    };
    if (!oldTx.futureReceipt) {
      newTx.status = TxStatus.CREATED;
    }
    if (!oldTx.futureReceipt && newTx.futureReceipt) {
      newTx.futureReceipt.once('error', (e: Error) => {
        if (e.message.indexOf('User denied transaction signature')) {
          this.setStatus(newTx, TxStatus.CANCELLED);
          this.delayedRemove(newTx.key);
        } else {
          this.setStatus(newTx, TxStatus.FAILED);
        }
      });
      newTx.futureReceipt.once('transactionHash', () => {
        this.setStatus(newTx, TxStatus.INFLIGHT);
      });
      newTx.futureReceipt.then(({ status }) => {
        const statusCode = status ? TxStatus.SUCCEED : TxStatus.FAILED;
        this.setStatus(newTx, statusCode);
        this.delayedRemove(newTx.key);
      });
      newTx.futureReceipt.catch(err => {
        console.log(err);
      });
    }
    this.map.set(newTx.key, Object.assign(oldTx, newTx));
  }

  private setStatus(tx: DetailedInflightTxReceipt, status: TxStatus) {
    runInAction(() => {
      this.map.set(tx.key, Object.assign(tx, { status }));
    });
  }

  private delayedRemove(key: string) {
    setTimeout(() => {
      runInAction(() => {
        this.map.delete(key);
      });
    }, 2000);
  }
}
