/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observer } from 'mobx-react';
import { Select, Icon, Tabs } from 'antd';

import Web3SubmitWarning from '../../components/web3SubmitWarning';
import TokenValue from '../../components/tokenValue';

import Deposit from './deposit';
import Transfer from './transfer';
import Exit from './exit';
import AppLayout from '../../components/appLayout';
import HexString from '../../components/hexString';
import TransactionsList from '../../routes/explorer/txList';
import { tokensStore } from '../../stores/tokens';
import { accountStore } from '../../stores/account';
import { selectedTokenStore } from '../../stores/selectedToken';
import { colorFromAddr } from '../../utils';
import ColorBadge from '../../components/colorBadge';

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
        <div
          style={{
            marginBottom: 30,
            marginTop: -20,
            marginLeft: -20,
            marginRight: -20,
            padding: 20,
            borderBottomColor: colorFromAddr(
              selectedTokenStore.token.address,
              80,
              50
            ),
            borderBottomWidth: 2,
            borderBottomStyle: 'solid',
          }}
        >
          <Select
            value={selectedTokenStore.color}
            style={{
              maxWidth: '100%',
              width: 400,
            }}
            className="token-select"
            onChange={v => {
              selectedTokenStore.color = v;
            }}
          >
            {tokensStore.list.map(token => (
              <Select.Option
                style={{
                  height: 70,
                }}
                key={String(token.color)}
                value={token.color}
              >
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {token.name}
                </span>
                {token.isNft && (
                  <Icon
                    type="trophy"
                    style={{ color: 'lightgray', marginLeft: '5px' }}
                  />
                )}
                <ColorBadge address={token.address} />
                <br />
                <span
                  style={{
                    position: 'relative',
                    marginRight: 10,
                    fontWeight: 'normal',
                    display: 'inline-flex',
                    flexDirection: 'column',
                  }}
                >
                  <TokenValue
                    value={token.balance}
                    color={token.color}
                    precision={3}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 'normal',
                      opacity: 0.4,
                      marginTop: -5,
                    }}
                  >
                    Ethereum
                  </span>
                </span>
                <span
                  style={{
                    position: 'relative',
                    marginRight: 10,
                    fontWeight: 'normal',
                    display: 'inline-flex',
                    flexDirection: 'column',
                  }}
                >
                  <TokenValue
                    value={token.plasmaBalance}
                    color={token.color}
                    precision={3}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 'normal',
                      opacity: 0.4,
                      marginTop: -5,
                    }}
                  >
                    Plasma
                  </span>
                </span>
              </Select.Option>
            ))}
          </Select>
        </div>

        <Tabs defaultActiveKey="0">
          <Tabs.TabPane tab="Deposit" key="0">
            <Deposit color={selectedTokenStore.color} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Transfer" key="1">
            <Transfer color={selectedTokenStore.color} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Exit" key="2">
            <Exit color={selectedTokenStore.color} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Token info" key="3">
            <dl className="info">
              <dt>Token contract address</dt>
              <dd>
                <HexString>{selectedTokenStore.token.address}</HexString>
              </dd>
            </dl>
          </Tabs.TabPane>
        </Tabs>

        <h2>Transactions</h2>
        <TransactionsList
          from={accountStore.address}
          to={accountStore.address}
          color={String(selectedTokenStore.color)}
        />
      </AppLayout>
    );
  }
}
