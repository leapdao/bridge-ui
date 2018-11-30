/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Component, Fragment } from 'react';
import { reaction } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import MediaQuery from 'react-responsive';
import { Dropdown, Icon, Layout, Menu, Spin, Button } from 'antd';

import Message from './message';
import TokenValue from './tokenValue';

import '../style.css';
import Bridge from '../stores/bridge';
import Tokens from '../stores/tokens';
import Account from '../stores/account';
import Web3Store from '../stores/web3';

function getBridgeSuffix(bridge: Bridge, currentAddr: string) {
  if (
    currentAddr &&
    bridge.defaultAddress.toLowerCase() !== currentAddr.toLowerCase()
  ) {
    return currentAddr;
  }

  return '';
}

interface AppLayoutProps {
  bridgeAddr?: string;
  bridge?: Bridge;
  tokens?: Tokens;
  account?: Account;
  web3?: Web3Store;
  section: string;
}

@inject('tokens', 'account', 'web3', 'bridge')
@observer
class AppLayout extends Component<AppLayoutProps, any> {
  constructor(props) {
    super(props);
    props.bridge.address = props.bridgeAddr || props.bridge.defaultAddress;

    reaction(
      () => props.bridge.defaultAddress,
      () => {
        props.bridge.address = props.bridgeAddr || props.bridge.defaultAddress;
      }
    );
  }

  private get psc() {
    return this.props.tokens.list && this.props.tokens.list[0];
  }

  componentDidUpdate(prevProps) {
    if (prevProps.bridgeAddr !== this.props.bridgeAddr) {
      this.props.bridge.address =
        this.props.bridgeAddr || this.props.bridge.defaultAddress;
    }
  }

  render() {
    const { account, web3, section, bridge, bridgeAddr } = this.props;

    if (web3.plasmaReady === false) {
      return <Message>No connection to Leap node</Message>;
    }

    if (!account.ready) {
      return (
        <Message hideBg>
          <Spin size="large" />
        </Message>
      );
    }

    const menu = horizontal => (
      <Menu
        selectedKeys={[section]}
        mode={horizontal ? 'horizontal' : 'vertical'}
        style={{ lineHeight: '64px', width: '100%' }}
      >
        <Menu.Item key="slots">
          <Link to={`/${getBridgeSuffix(bridge, bridgeAddr)}`}>
            Slots auction
          </Link>
        </Menu.Item>
        <Menu.Item key="registerToken">
          <Link to={`/registerToken/${getBridgeSuffix(bridge, bridgeAddr)}`}>
            Register token
          </Link>
        </Menu.Item>
        <Menu.Item key="wallet">
          <Link to="/wallet">Wallet</Link>
        </Menu.Item>
        <Menu.Item key="faucet">
          <Link to="/faucet">Get tokens</Link>
        </Menu.Item>
        <Menu.Item key="explorer">
          <Link to="/explorer">Explorer</Link>
        </Menu.Item>
        <Menu.Item key="status">
          <Link to="/status">Status</Link>
        </Menu.Item>
      </Menu>
    );

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Header
          style={{
            backgroundColor: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <MediaQuery minWidth={1049}>{menu(true)}</MediaQuery>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="balance">
              {this.psc && this.psc.balance && this.psc.ready && (
                <Fragment>
                  Balance:{' '}
                  <strong>
                    <TokenValue
                      value={this.psc.balance}
                      color={this.psc.color}
                    />
                  </strong>
                </Fragment>
              )}
              {web3 && web3.injectedAvailable && !web3.injected && (
                <Button
                  onClick={() => {
                    web3.enable();
                  }}
                >
                  <span
                    role="img"
                    aria-label="fox"
                    style={{ bottom: -1, position: 'relative' }}
                  >
                    🦊
                  </span>{' '}
                  Connect MetaMask
                </Button>
              )}
            </span>
            <MediaQuery maxWidth={1048}>
              <Dropdown overlay={menu(false)} placement="bottomRight">
                <a
                  className="ant-dropdown-link"
                  href="#"
                  style={{
                    paddingTop: 8,
                  }}
                >
                  <Icon type="bars" style={{ fontSize: 24 }} />
                </a>
              </Dropdown>
            </MediaQuery>
          </div>
        </Layout.Header>
        <Layout.Content
          style={{
            padding: '20px 50px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ backgroundColor: '#FFF', padding: 20 }}>
            {this.props.children}
          </div>
        </Layout.Content>
        <Layout.Footer>© Leap DAO {new Date().getFullYear()}</Layout.Footer>
      </Layout>
    );
  }
}

export default AppLayout;
