/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import {
  observable,
  action,
  computed,
  autorun,
  IObservableArray,
  reaction,
} from 'mobx';
import { helpers, Tx, Input, Output } from 'leap-core';
import * as Web3PromiEvent from 'web3-core-promievent';
import autobind from 'autobind-decorator';
import { EventLog } from 'web3/types';
import { erc20, erc721 } from '../utils/abis';
import { isNFT, isNST } from '../utils';
import { txSuccess } from '../utils/txSuccess';

import { InflightTxReceipt } from '../utils/types';
import { range } from '../utils/range';
import { tokenInfo, isOurTransfer } from './utils';

import {
  BigIntType,
  equal,
  bi,
  exponentiate,
  toNumber,
  ZERO,
} from 'jsbi-utils';
import { ContractStore } from './contractStore';
import { accountStore } from './account';
import { nodeStore } from './node';
import { web3InjectedStore } from './web3/injected';
import { web3PlasmaStore } from './web3/plasma';

const Big = require('big.js');

export class TokenStore extends ContractStore {
  @observable
  public name: string;
  @observable
  public symbol: string;
  @observable
  public decimals: number;
  @observable.ref
  public balance?: BigIntType | BigIntType[];
  @observable.ref
  public plasmaBalance?: BigIntType | BigIntType[];

  constructor(address: string, public color: number) {
    super(isNFT(color) ? erc721 : erc20, address);

    autorun(this.loadBalance.bind(null, false));
    autorun(this.loadBalance.bind(null, true));
    tokenInfo(this.contract, color).then(this.setInfo);

    if (this.contract) {
      this.contract.events.Transfer({}, (_, event: EventLog) => {
        if (isOurTransfer(event, accountStore)) {
          this.loadBalance(false);
        }
      });
    }

    reaction(() => nodeStore.latestBlock, this.loadBalance.bind(null, true));
  }

  @computed
  public get decimalsBalance(): number {
    if (this.isNft) {
      return (this.balance as BigIntType[]).length;
    }

    return this.balance && this.toTokens(this.balance as BigIntType);
  }

  @computed
  public get ready() {
    return !!this.symbol;
  }

  public get isNft() {
    return isNFT(this.color);
  }

  public get isNst() {
    return isNST(this.color);
  }

  /**
   * Converts given amount of tokens to token cents according to this token decimals.
   * Returns given value unchanged if this token is NFT.
   * @param tokenValue Amount of tokens to convert to token cents or token Id for NFT token
   */
  public toCents(tokenValue: BigIntType | number | string): BigIntType {
    if (this.isNft) {
      return bi(tokenValue);
    }
    let valueNum;
    try {
      valueNum = Big(String(tokenValue));
    } catch (e) {
      return ZERO;
    }

    return bi(
      valueNum
        .mul(10 ** this.decimals)
        .round()
        .toFixed()
    );
  }

  /**
   * Converts given amount of token cents to the whole token according to this token decimals.
   * Returns given value unchanged if this token is NFT.
   * @param tokenValue Amount of token cents to convert to tokens or token Id for NFT token
   */
  public toTokens(tokenCentsValue: BigIntType) {
    if (this.isNft) {
      return toNumber(tokenCentsValue);
    }
    return Big(tokenCentsValue.toString() || 0)
      .div(10 ** this.decimals)
      .toFixed();
  }

  public transfer(to: string, amount: BigIntType): Promise<any> {
    if (!web3InjectedStore.instance) {
      return Promise.reject('No metamask');
    }

    const promiEvent = Web3PromiEvent();
    web3PlasmaStore.instance
      .getUnspent(accountStore.address)
      .then(unspent => {
        if (this.isNft) {
          let data;
          const { outpoint } = unspent.find(({ output }) => {
            if (
              Number(output.color) === Number(this.color) &&
              equal(bi(output.value), bi(amount))
            ) {
              data = output.data;
              return true;
            } else {
              return false;
            }
          });
          if (this.isNst) {
            return Tx.transfer(
              [new Input(outpoint)],
              [new Output(amount as any, to, this.color, data)]
            );
          }
          return Tx.transfer(
            [new Input(outpoint)],
            [new Output(amount as any, to, this.color)]
          );
        }

        const inputs = helpers.calcInputs(
          unspent,
          accountStore.address,
          amount as any,
          this.color
        );
        const outputs = helpers.calcOutputs(
          unspent,
          inputs,
          accountStore.address,
          to,
          amount as any,
          this.color
        );
        return Tx.transfer(inputs, outputs);
      })
      .then(tx => tx.signWeb3(web3InjectedStore.instance as any))
      .then(
        signedTx => {
          promiEvent.eventEmitter.emit('transactionHash', signedTx.hash());
          return {
            futureReceipt: web3PlasmaStore.instance.eth.sendSignedTransaction(
              signedTx.hex() as any
            ),
          };
        },
        err => {
          promiEvent.reject(err);
          promiEvent.eventEmitter.emit('error', err);
        }
      )
      .then(receipt => {
        promiEvent.eventEmitter.emit('receipt', receipt);
        promiEvent.resolve({
          ...receipt,
          status: 'success',
        });
      });

    this.watchTx(promiEvent.eventEmitter, 'plasmaSign', {
      message: 'Sign plasma transfer',
      description:
        'Before you proceed with your tx, you need to sign a message',
    });

    return txSuccess(promiEvent.eventEmitter);
  }

  public approveAndCall(
    to: string,
    value: number,
    data: string
  ): Promise<InflightTxReceipt> {
    if (!this.iContract) {
      throw new Error('No metamask');
    }

    return this.maybeApprove(to, value).then(() => {
      const futureReceipt = web3InjectedStore.instance.eth.sendTransaction({
        from: accountStore.address,
        to,
        data,
      });
      return { futureReceipt } as any; // wrapping, otherwise PromiEvent will be returned upstream only when resolved
    });
  }

  @autobind
  @action
  private setInfo([symbol, decimals, name]: [string, string, string]) {
    this.name = name;
    this.symbol = symbol;
    this.decimals = Number(decimals);
  }

  @autobind
  @action
  private updateBalance(balance: BigIntType | BigIntType[], plasma = false) {
    if (plasma) {
      this.plasmaBalance = balance;
    } else {
      this.balance = balance;
    }
  }

  public balanceOf(address: string, plasma = false) {
    const contract = plasma ? this.plasmaContract : this.contract;
    return contract.methods
      .balanceOf(address)
      .call()
      .then(
        (balance): Promise<BigIntType | BigIntType[]> => {
          if (this.isNft) {
            return Promise.all(
              range(0, balance - 1).map(i =>
                contract.methods
                  .tokenOfOwnerByIndex(address, i)
                  .call()
                  .then(v => bi(v))
              )
              // assuming that exception happens due to missing `tokenOfOwnerByIndex`
              // which is only for ERC721Enumerable. For non-enumerable NFTs let's return
              // an array with proper size and no values
            ).catch(
              () => new Array<BigIntType>(parseInt(balance, 10))
            ) as Promise<BigIntType[]>;
          }

          return Promise.resolve(bi(balance));
        }
      );
  }

  @autobind
  private loadBalance(plasma = false) {
    if (!accountStore.address) {
      return;
    }
    this.balanceOf(accountStore.address, plasma).then(balance => {
      this.updateBalance(balance, plasma);
    });
  }

  private allowanceOrTokenId(valueOrTokenId: number) {
    if (this.isNft) {
      return valueOrTokenId;
    }

    return `0x${exponentiate(bi(2), bi(255)).toString(16)}`;
  }

  private hasEnoughAllowance(spender: string, value: number): Promise<boolean> {
    if (this.isNft) {
      return this.iContract.methods
        .getApproved(value)
        .call()
        .then(operator => operator === spender);
    } else {
      return this.iContract.methods
        .allowance(accountStore.address, spender)
        .call()
        .then(allowance => Number(allowance) >= value);
    }
  }

  /*
   * Checks transfer allowance for a given spender. If allowance is not enough to transfer a given value,
   * initiates an approval transaction for 2^256 units. Approving maximum possible amount to make `approve` tx
   * one time only — subsequent calls won't requre approve anymore.
   * @param spender Account to approve transfer for
   * @param value Minimal amount of allowance a spender should have
   * @returns Promise resolved when allowance is enough for the transfer
   */
  private maybeApprove(spender: string, value: number) {
    return this.hasEnoughAllowance(spender, value).then(hasEnoughAllowance => {
      if (hasEnoughAllowance) {
        return;
      }

      const tx = this.iContract.methods
        .approve(spender, String(this.allowanceOrTokenId(value)))
        .send({ from: accountStore.address });

      this.watchTx(tx, 'approve', {
        message: `Approve bridge to transfer ${this.symbol}`,
        description:
          'Before you proceed with your tx, you need to sign a ' +
          `transaction to allow the bridge contract to transfer your ${
            this.symbol
          }.`,
      });

      return txSuccess(tx);
    });
  }
}
