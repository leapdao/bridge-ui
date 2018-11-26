/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { reaction } from 'mobx';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import MediaQuery from 'react-responsive';
import { Dropdown, Icon, Layout, Menu, Spin, Button } from 'antd';

import Message from './message';
import TokenValue from './tokenValue';

import '../style.css';

function getBridgeSuffix(bridge, currentAddr) {
  if (
    currentAddr &&
    bridge.defaultAddress.toLowerCase() !== currentAddr.toLowerCase()
  ) {
    return currentAddr;
  }

  return '';
}

@inject(stores => ({
  psc: stores.tokens.list && stores.tokens.list[0],
  account: stores.account,
  web3: stores.web3,
  bridge: stores.bridge,
}))
@observer
class AppLayout extends React.Component {
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

  componentDidUpdate(prevProps) {
    if (prevProps.bridgeAddr !== this.props.bridgeAddr) {
      this.props.bridge.address =
        this.props.bridgeAddr || this.props.bridge.defaultAddress;
    }
  }

  render() {
    const { psc, account, web3, section, bridge, bridgeAddr } = this.props;

    if (web3.plasmaReady === false) {
      return <Message>No connection to Leap node</Message>;
    }

    if (!account.ready || web3.plasmaReady === undefined) {
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
              {psc && psc.balance && psc.ready && (
                <Fragment>
                  Balance:{' '}
                  <strong>
                    <TokenValue value={psc.balance} color={psc.color} />
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
              <Dropdown
                overlay={menu(false)}
                placement="bottomRight"
                style={{ flexGrow: 1 }}
              >
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

AppLayout.propTypes = {
  // settings stores as optional to get rid of 'undefined' warnings
  // > Make sure to mark userStore as an optional property.
  // > It should not (necessarily) be passed in by parent components at all!
  // https://github.com/mobxjs/mobx-react#with-typescript
  psc: PropTypes.object,
  web3: PropTypes.object,
  account: PropTypes.object,
  children: PropTypes.any,
  section: PropTypes.string,
  bridgeAddr: PropTypes.string,
  bridge: PropTypes.object,
};

export default AppLayout;
