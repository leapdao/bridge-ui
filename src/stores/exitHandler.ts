/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import { reaction, action } from 'mobx';
import { EventLog } from 'web3/types';
import autobind from 'autobind-decorator';

import { exitHandler as exitHandlerAbi } from '../utils/abis';

import Token from './token';
import Account from './account';
import ContractStore from './contractStore';
import Transactions from '../components/txNotification/transactions';

import { InflightTxReceipt } from '../utils/types';
import Web3Store from './web3/';
import PlasmaConfig from './plasmaConfig';

export default class ExitHandler extends ContractStore {

  constructor(
    private account: Account,
    transactions: Transactions,
    web3: Web3Store,
    private readonly plasmaConfig: PlasmaConfig,
    address?: string
  ) {
    super(exitHandlerAbi, address, transactions, web3);

    if (plasmaConfig.exitHandlerAddr) {
      this.setAddress();
    } else {
      reaction(() => plasmaConfig.exitHandlerAddr, this.setAddress);
    }
    
  }

  public deposit(token: Token, amount: any): Promise<InflightTxReceipt> {
    if (!this.iContract) {
      throw new Error('No metamask');
    }
    console.log(this.account.address, String(amount), token.color);
    const data = this.contract.methods
      .deposit(this.account.address, String(amount), token.color)
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
      from: this.account.address,
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
    youngestInputProof: string[], proof: string[], outIndex: number, inputIndex: number
  ) {
    return this.getExitStake().then(exitStake => {
      const tx = this.iContract.methods.startExit(youngestInputProof, proof, outIndex, inputIndex).send({
        from: this.account.address,
        value: String(exitStake)
      });

      this.watchTx(tx, 'startExit', {
        message: 'Exit',
      });

      return tx;
    });
  }

  public finalizeExits(color: number) {
    const tx = this.iContract.methods.finalizeTopExit(color).send({
      from: this.account.address,
    });

    this.watchTx(tx, 'finalizeTopExit', {
      message: 'Finalize exit',
    });

    return tx;
  }

  @autobind
  @action
  private setAddress() {
    if (!this.plasmaConfig.exitHandlerAddr) return;
    this.address = this.plasmaConfig.exitHandlerAddr;
  }
}
