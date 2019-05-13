/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observable, computed } from 'mobx';
import { observer, inject } from 'mobx-react';

import Web3SubmitWarning from '../../components/web3SubmitWarning';

import Deposit from './deposit';
import Transfer from './transfer';
import Exit from './exit';
import AppLayout from '../../components/appLayout';
import HexString from '../../components/hexString';
import TransactionsList from '../../routes/explorer/txList';
import { tokensStore } from '../../stores/tokens';
import { accountStore } from '../../stores/account';

interface WalletProps {}

@observer
export default class Wallet extends React.Component<WalletProps, any> {
  @computed
  private get selectedToken() {
    return tokensStore.tokenForColor(this.color);
  }

  @observable
  private color = 0;

  public render() {
    if (!accountStore.address) {
      return (
        <AppLayout section="wallet">
          <Web3SubmitWarning />
        </AppLayout>
      );
    }

    if (
      !tokensStore.ready ||
      !this.selectedToken ||
      !this.selectedToken.ready
    ) {
      return <AppLayout section="wallet" />;
    }

    if (tokensStore.list.length === 0) {
      return (
        <AppLayout section="wallet">
          <div style={{ textAlign: 'center', margin: 50, fontSize: 18 }}>
            You need to register some token first
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout section="wallet">
        <Web3SubmitWarning />
        My address: <HexString>{accountStore.address}</HexString>
        <Deposit
          color={this.color}
          onColorChange={color => {
            this.color = color;
          }}
        />
        <Transfer color={this.color} />
        <Exit color={this.color} />
        <h2>Transactions ({this.selectedToken.symbol})</h2>
        <TransactionsList
          from={accountStore.address}
          to={accountStore.address}
          color={String(this.color)}
        />
      </AppLayout>
    );
  }
}
