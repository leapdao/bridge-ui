/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, computed, reaction, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';

import { range, NFT_COLOR_BASE, isNFT } from '../utils';
import Account from './account';
import Token from './token';
import ExitHandler from './exitHandler';
import Transactions from '../components/txNotification/transactions';
import { Output } from 'leap-core';
import NodeStore from './node';
import Web3Store from './web3/';

export default class Tokens {
  @observable
  public list: IObservableArray<Token>;

  private erc20TokenCount: number;
  private nftTokenCount: number;

  constructor(
    private account: Account,
    private exitHandler: ExitHandler,
    private txs: Transactions,
    private node: NodeStore,
    private web3: Web3Store
  ) {
    this.erc20TokenCount = 0;
    this.nftTokenCount = 0;

    reaction(() => this.exitHandler.contract, this.init);
    reaction(
      () => this.exitHandler.events,
      () => {
        this.exitHandler.events.on('NewToken', this.loadTokens.bind(this));
      }
    );
  }

  @autobind
  private init() {
    this.loadTokens();
  }

  @autobind
  @action
  private addTokens(tokens: Array<Token>) {
    if (!this.list) {
      this.list = observable.array([]);
    }
    tokens.forEach(token => {
      this.list.push(token);
    });
  }

  @computed
  public get ready() {
    if (!this.list) {
      return false;
    }
    return !this.list.some(token => !token.ready);
  }

  public tokenIndexForAddress(address: string) {
    if (!this.list) {
      return -1;
    }

    return this.list.findIndex(
      t => t.address.toLowerCase() === address.toLowerCase()
    );
  }

  public tokenForAddress(address: string) {
    const index = this.tokenIndexForAddress(address);
    if (index < 0 || index >= this.list.length) {
      return undefined;
    }

    return this.list[index];
  }

  public tokenIndexForColor(color: number) {
    if (!this.list) {
      return -1;
    }

    return isNFT(color)
      ? this.erc20TokenCount + (color - NFT_COLOR_BASE)
      : color;
  }

  public tokenForColor(color: number) {
    const index = this.tokenIndexForColor(color);
    if (index < 0 || index >= this.list.length) {
      return undefined;
    }

    return this.list[index];
  }

  private loadTokenColorRange(from: number, to: number): Promise<Token>[] {
    return (range(from, to) as number[]).map(color => {
      return this.exitHandler.contract.methods
        .tokens(color)
        .call()
        .then(({ 0: address }) => {
          return new Token(
            this.account,
            this.txs,
            address,
            color,
            this.node,
            this.web3
          );
        });
    });
  }

  public loadTokens() {
    return Promise.all([
      this.exitHandler.contract.methods
        .erc20TokenCount()
        .call()
        .then(r => Number(r)),
      this.exitHandler.contract.methods
        .nftTokenCount()
        .call()
        .then(r => Number(r)),
    ])
      .then(([erc20TokenCount, nftTokenCount]) => {
        // load new tokens for ERC20 and ERC721 color ranges
        const tokens = Promise.all([
          ...this.loadTokenColorRange(
            this.erc20TokenCount,
            erc20TokenCount - 1
          ),
          ...this.loadTokenColorRange(
            NFT_COLOR_BASE + this.nftTokenCount,
            NFT_COLOR_BASE + nftTokenCount - 1
          ),
        ]);
        this.erc20TokenCount = erc20TokenCount;
        this.nftTokenCount = nftTokenCount;
        return tokens;
      })
      .then(this.addTokens);
  }
}
