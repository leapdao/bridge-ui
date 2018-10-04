/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { Route, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import MediaQuery from 'react-responsive';
import { Dropdown, Icon, Layout, Menu, Spin } from 'antd';

import parsecLabsLogo from '../parseclabs.svg';

import Message from './message';

import '../style.css';

@inject(stores => ({
  psc: stores.tokens.list && stores.tokens.list[0],
  account: stores.account,
}))
@observer
class AppLayout extends React.Component {
  render() {
    const { psc, account, match } = this.props;

    if (!account.ready) {
      return (
        <Message hideBg>
          <Spin size="large" />
        </Message>
      );
    }

    const menu = horizontal => (
      <Route
        path={`${match.path}/:section?`}
        render={({
          match: {
            params: { section },
          },
        }) => (
          <Menu
            selectedKeys={[section || 'slots']}
            mode={horizontal ? 'horizontal' : 'vertical'}
            style={{ lineHeight: '64px', width: '100%' }}
          >
            <Menu.Item key="slots">
              <Link to={`${match.url}`}>Slots auction</Link>
            </Menu.Item>
            <Menu.Item key="deposit">
              <Link to={`${match.url}/deposit`}>Deposit/exit</Link>
            </Menu.Item>
            <Menu.Item key="registerToken">
              <Link to={`${match.url}/registerToken`}>Register token</Link>
            </Menu.Item>
            <Menu.Item key="faucet">
              <Link to={`${match.url}/faucet`}>Get tokens</Link>
            </Menu.Item>
            <Menu.Item key="explorer">
              <Link to={`${match.url}/explorer`}>Explorer</Link>
            </Menu.Item>
          </Menu>
        )}
      />
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
          <Link to={`${match.url}`}>
            <img
              src={parsecLabsLogo}
              width="196"
              height="50"
              className="logo"
              alt=""
            />
          </Link>

          <MediaQuery minWidth={1049}>{menu(true)}</MediaQuery>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="balance">
              {psc &&
                psc.balanceString && (
                  <Fragment>
                    Balance: <strong>{psc.balanceString}</strong>
                  </Fragment>
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
        <Layout.Footer>© PARSEC Labs {new Date().getFullYear()}</Layout.Footer>
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
  account: PropTypes.object,
  match: PropTypes.object.isRequired,
  children: PropTypes.any,
};

export default withRouter(AppLayout);
