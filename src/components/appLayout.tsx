/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Component, Fragment } from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import MediaQuery from 'react-responsive';
import { Dropdown, Icon, Layout, Menu, Spin, Button, Alert } from 'antd';

import { CONFIG } from '../config';
import AppLogo from './appLogo';
import Message from './message';
import TokenValue from './tokenValue';

import '../style.css';

import ConnectionStatusBadge from './ConnectionStatusBadge';
import { tokensStore } from '../stores/tokens';
import { web3PlasmaStore } from '../stores/web3/plasma';
import { accountStore } from '../stores/account';
import { web3InjectedStore } from '../stores/web3/injected';
import { web3RootStore } from '../stores/web3/root';
import { selectedTokenStore } from '../stores/selectedToken';

interface AppLayoutProps {
  section: string;
}

@observer
class AppLayout extends Component<AppLayoutProps, any> {
  private dropdown: any = null;

  @observable private menuVisible = false;

  public componentDidMount() {
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

  private get leap() {
    return tokensStore.tokenForColor(0);
  }

  public render() {
    const { section } = this.props;

    if (web3PlasmaStore.ready === false) {
      return <Message>No connection to Leap node</Message>;
    }

    if (!accountStore.ready) {
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
              {web3InjectedStore.available && !web3InjectedStore.instance && (
                <Button
                  onClick={() => {
                    web3InjectedStore.enable();
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

        {CONFIG.announceMigration && (
          <Alert
            message="Network will be revamped on 27 July 2019 14:00 UTC."
            description={
              <Fragment>
                Do not transact after that date. See our{' '}
                <a href="https://leapdao.org/blog/mainnet-revamp/">blog post</a>{' '}
                for details
              </Fragment>
            }
            type="warning"
            showIcon
          />
        )}

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
        <Layout.Footer>
          <span style={{ verticalAlign: 'middle' }}>
            © Leap DAO {new Date().getFullYear()}
          </span>
          <ConnectionStatusBadge
            connectionStatus={web3RootStore.connectionStatus}
          />
        </Layout.Footer>
      </Layout>
    );
  }
}

export default AppLayout;
