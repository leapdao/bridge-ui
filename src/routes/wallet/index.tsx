/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';

import Web3SubmitWarning from '../../components/web3SubmitWarning';

import Deposit from './deposit';
import Transfer from './transfer';
import Exit from './exit';
import AppLayout from '../../components/appLayout';
import HexString from '../../components/hexString';
import TransactionsList from '../../routes/explorer/txList';
import { tokensStore } from '../../stores/tokens';
import { accountStore } from '../../stores/account';
import { selectedTokenStore } from '../../stores/selectedToken';

interface WalletProps {}

@observer
export default class Wallet extends React.Component<WalletProps, any> {
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
      !selectedTokenStore.token ||
      !selectedTokenStore.token.ready
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
          color={selectedTokenStore.color}
          onColorChange={color => {
            selectedTokenStore.color = color;
          }}
        />
        <Transfer color={selectedTokenStore.color} />
        <Exit color={selectedTokenStore.color} />
        <h2>Transactions ({selectedTokenStore.token.symbol})</h2>
        <TransactionsList
          from={accountStore.address}
          to={accountStore.address}
          color={String(selectedTokenStore.color)}
        />
      </AppLayout>
    );
  }
}
