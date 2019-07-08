/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { observable, action, computed, reaction, IObservableArray } from 'mobx';
import autobind from 'autobind-decorator';

import { range, NFT_COLOR_BASE, NST_COLOR_BASE, isNFT, isNST } from '../utils';
import { TokenStore } from './token';
import { exitHandlerStore } from './exitHandler';

export class TokensStore {
  @observable
  public list: IObservableArray<TokenStore>;

  private erc20TokenCount: number;
  private nftTokenCount: number;
  private nstTokenCount: number;

  constructor() {
    this.erc20TokenCount = 0;
    this.nftTokenCount = 0;
    this.nstTokenCount = 0;

    reaction(() => exitHandlerStore.contract, this.init);
    reaction(
      () => exitHandlerStore.contract,
      () => {
        exitHandlerStore.contract.events.NewToken(
          {},
          this.loadTokens.bind(this)
        );
      }
    );
  }

  @autobind
  private init() {
    this.loadTokens();
  }

  @autobind
  @action
  private addTokens(tokens: TokenStore[]) {
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

  public tokenForAddress(address: string): TokenStore {
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

    if (isNST(color)) {
      return (
        this.erc20TokenCount + this.nftTokenCount + (color - NST_COLOR_BASE)
      );
    }

    if (isNFT(color)) {
      return this.erc20TokenCount + (color - NFT_COLOR_BASE);
    }

    return color;
  }

  public tokenForColor(color: number) {
    const index = this.tokenIndexForColor(color);
    if (index < 0 || index >= this.list.length) {
      return undefined;
    }

    return this.list[index];
  }

  private loadTokenColorRange(from: number, to: number) {
    return (range(from, to) as number[]).map(color => {
      return exitHandlerStore.contract.methods
        .tokens(color)
        .call()
        .then(({ 0: address }) => {
          return new TokenStore(address, color);
        });
    });
  }

  public loadTokens() {
    return Promise.all([
      exitHandlerStore.contract.methods
        .erc20TokenCount()
        .call()
        .then(r => Number(r)),
      exitHandlerStore.contract.methods
        .nftTokenCount()
        .call()
        .then(r => Number(r)),
      exitHandlerStore.contract.methods
        .nstTokenCount()
        .call()
        .then(r => Number(r)),
    ])
      .then(([erc20TokenCount, nftTokenCount, nstTokenCount]) => {
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
          ...this.loadTokenColorRange(
            NST_COLOR_BASE + this.nstTokenCount,
            NST_COLOR_BASE + nstTokenCount - 1
          ),
        ]);
        this.erc20TokenCount = erc20TokenCount;
        this.nftTokenCount = nftTokenCount;
        this.nstTokenCount = nstTokenCount;
        return tokens;
      })
      .then(this.addTokens);
  }
}

export const tokensStore = new TokensStore();
