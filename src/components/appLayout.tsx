/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import MediaQuery from 'react-responsive';
import { Dropdown, Icon, Layout, Menu, Spin } from 'antd';

import { CONFIG } from '../config';
import AppLogo from './appLogo';
import Message from './message';
import TokenValue from './tokenValue';

import '../style.css';
import Tokens from '../stores/tokens';
import Account from '../stores/account';
import Web3Store from '../stores/web3/';
import { observable } from 'mobx';
import ConnectWeb3 from './connectWeb3';

interface AppLayoutProps {
  tokens?: Tokens;
  account?: Account;
  web3?: Web3Store;
  section: string;
}

@inject('tokens', 'account', 'web3')
@observer
class AppLayout extends Component<AppLayoutProps, any> {
  private dropdown: any = null;

  @observable menuVisible = false;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    document.addEventListener('click', e => {
      if (
        !(
          this.dropdown &&
          ReactDOM.findDOMNode(this.dropdown).contains(e.target)
        )
      ) {
        this.menuVisible = false;
      }
    });
  }

  private get psc() {
    return this.props.tokens.list && this.props.tokens.list[0];
  }

  render() {
    const { account, web3, section } = this.props;

    if (web3.plasma.ready === false) {
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
        <Menu.Item key="governance">
          <Link to="/governance">Governance</Link>
        </Menu.Item>
        {CONFIG.consensus !== 'poa' && (
          <Menu.Item key="slots">
            <Link to={`/slots`}>Slots auction</Link>
          </Menu.Item>
        )}
        <Menu.Item key="registerToken">
          <Link to={`/registerToken`}>Register token</Link>
        </Menu.Item>
        <Menu.Item key="wallet">
          <Link to="/wallet">Wallet</Link>
        </Menu.Item>
        {CONFIG.tokenFaucet && (
          <Menu.Item key="faucet">
            <Link to="/faucet">Get tokens</Link>
          </Menu.Item>
        )}
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
          <Link to="/">
            <AppLogo />
          </Link>
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
              {web3 && web3.injected.available && !web3.injected.instance && (
                <ConnectWeb3 onClick={() => { web3.injected.enable(); }}/>
              )}
            </span>
            <MediaQuery maxWidth={1048}>
              <Dropdown
                overlay={menu(false)}
                placement="bottomRight"
                visible={this.menuVisible}
                ref={ref => {
                  this.dropdown = ref;
                }}
              >
                <div
                  tabIndex={0}
                  style={{
                    padding: '0 5px',
                    marginRight: -5,
                  }}
                  onClick={() => {
                    this.menuVisible = !this.menuVisible;
                  }}
                >
                  <Icon type="bars" style={{ fontSize: 24 }} />
                </div>
              </Dropdown>
            </MediaQuery>
          </div>
        </Layout.Header>
        <Layout.Content
          style={{
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
