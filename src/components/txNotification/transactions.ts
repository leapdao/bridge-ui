/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { action, observable, ObservableMap, runInAction } from 'mobx';
import autobind from 'autobind-decorator';
import { TxStatus, InflightTxPromise } from "./types";


export default class Transactions {
  @observable public map: ObservableMap<string, InflightTxPromise>;

  constructor() {
    this.map = observable.map({});
  }

  @autobind
  @action
  public update(key, tx: InflightTxPromise) {
    const prevTx = this.map.get(key) || { tx: null };
    if (!prevTx.tx) {
      tx.key = key;
      tx.status = TxStatus.CREATED;  
    }
    if (!prevTx.tx && tx.tx) {
      tx.tx.once('error', (e: Error) => {
        if (e.message.indexOf('User denied transaction signature')) {
          this.setStatus(prevTx, TxStatus.CANCELLED);    
        } else {
          this.setStatus(prevTx, TxStatus.FAILED);
        }
      });

      tx.tx.once('transactionHash', () => {
        this.setStatus(prevTx, TxStatus.INFLIGHT);
      });
      tx.tx.then(({ status }) => {
        const statusCode = status ? TxStatus.SUCCEED : TxStatus.FAILED;
        this.setStatus(prevTx, statusCode);
      })
    }
    this.map.set(key, Object.assign(prevTx, tx));
  }

  private setStatus(tx: InflightTxPromise, status: TxStatus) {
    runInAction(() => {
      this.map.set(tx.key, Object.assign(tx, { status }));      
    });
  }

}
