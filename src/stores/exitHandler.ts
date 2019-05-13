/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import { reaction, action, observable } from 'mobx';
import autobind from 'autobind-decorator';

import { exitHandler as exitHandlerAbi } from '../utils/abis';
import { InflightTxReceipt } from '../utils/types';
import { ContractStore } from './contractStore';
import { plasmaConfigStore } from './plasmaConfig';
import { accountStore } from './account';
import { TokenStore } from './token';

export class ExitHandlerStore extends ContractStore {
  constructor(address?: string) {
    super(exitHandlerAbi, address);

    if (plasmaConfigStore.exitHandlerAddr) {
      this.setAddress();
    } else {
      reaction(() => plasmaConfigStore.exitHandlerAddr, this.setAddress);
    }
  }

  public exitQueueSize(color: number) {
    return this.contract.methods
      .tokens(color)
      .call()
      .then(queue => queue.currentSize);
  }

  public deposit(token: TokenStore, amount: any): Promise<InflightTxReceipt> {
    if (!this.iContract) {
      throw new Error('No metamask');
    }
    console.log(accountStore.address, String(amount), token.color);
    const data = this.contract.methods
      .deposit(accountStore.address, String(amount), token.color)
      .encodeABI();

    const inflightTxReceiptPromise = token.approveAndCall(
      this.address,
      amount,
      data
    );

    this.watchTx(inflightTxReceiptPromise, 'deposit', {
      message: 'Deposit tokens to the bridge',
    });

    return inflightTxReceiptPromise;
  }

  public registerToken(tokenAddr: string) {
    const tx = this.iContract.methods.registerToken(tokenAddr).send({
      from: accountStore.address,
    });

    this.watchTx(tx, 'registerToken', {
      message: 'Register a new token on the bridge',
    });

    return tx;
  }

  public getExitStake() {
    return this.iContract.methods.exitStake().call();
  }

  public startExit(
    youngestInputProof: string[],
    proof: string[],
    outIndex: number,
    inputIndex: number
  ) {
    return this.getExitStake().then(exitStake => {
      const tx = this.iContract.methods
        .startExit(youngestInputProof, proof, outIndex, inputIndex)
        .send({
          from: accountStore.address,
          value: String(exitStake),
        });

      this.watchTx(tx, 'startExit', {
        message: 'Exit',
      });

      return tx;
    });
  }

  public finalizeExits(color: number) {
    const tx = this.iContract.methods.finalizeTopExit(color).send({
      from: accountStore.address,
    });

    this.watchTx(tx, 'finalizeTopExit', {
      message: 'Finalize exit',
    });

    return tx;
  }

  @autobind
  @action
  private setAddress() {
    if (!plasmaConfigStore.exitHandlerAddr) {
      return;
    }
    this.address = plasmaConfigStore.exitHandlerAddr;
  }
}

export const exitHandlerStore = new ExitHandlerStore();
