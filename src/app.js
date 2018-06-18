/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import 'antd/dist/antd.css';

import React from 'react';
import PropTypes from 'prop-types';
import { Route, withRouter } from 'react-router'; // eslint-disable-line
import { Link } from 'react-router-dom'; // eslint-disable-line
import { Layout, Menu } from 'antd';

import Slots from './routes/slots'; // eslint-disable-line
import Deposit from './routes/deposit'; // eslint-disable-line
import Faucet from './routes/faucet'; // eslint-disable-line
import promisifyWeb3Call from './promisifyWeb3Call';
import getWeb3 from './getWeb3';
import { token as tokenAbi, bridge as bridgeAbi } from './abis';
import { tokenAddress, bridgeAddress } from './addrs';

import parsecLabsLogo from './parseclabs.svg';

import './style.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: null,
    };
  }

  componentDidMount() {
    this.token = getWeb3(true)
      .eth.contract(tokenAbi)
      .at(tokenAddress);
    this.bridge = getWeb3(true)
      .eth.contract(bridgeAbi)
      .at(bridgeAddress);

    this.loadData();

    const bridgeEvents = this.bridge.allEvents({ toBlock: 'latest' });
    bridgeEvents.watch(() => {
      this.loadData();
    });

    const transferEvents = this.token.Transfer({ toBlock: 'latest' });
    transferEvents.watch((err, e) => {
      if (e.args.to === this.props.account) {
        this.loadData();
      }
    });
  }

  loadData() {
    const { account } = this.props;
    Promise.all([promisifyWeb3Call(this.token.balanceOf, account)]).then(
      ([balance]) => {
        this.setState({ balance });
      }
    );
  }

  render() {
    const { balance } = this.state;
    const { decimals, symbol } = this.props;
    if (!balance) {
      return null;
    }
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
            <img
              src={parsecLabsLogo}
              width="196"
              height="50"
              className="logo"
              alt=""
            />
          </Link>
          <Menu
            selectedKeys={[this.props.location.pathname]}
            mode="horizontal"
            style={{ lineHeight: '64px', width: '100%' }}
          >
            <Menu.Item key="/">
              <Link to="/">Slots auction</Link>
            </Menu.Item>
            <Menu.Item key="/deposit">
              <Link to="/deposit">Make deposit</Link>
            </Menu.Item>
            <Menu.Item key="/faucet">
              <Link to="/faucet">Get tokens</Link>
            </Menu.Item>
          </Menu>

          <span className="balance">
            Balance:{' '}
            <strong>
              {Number(balance.div(decimals))} {symbol}
            </strong>
          </span>
        </Layout.Header>
        <Layout.Content
          style={{
            padding: '20px 50px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ backgroundColor: '#FFF', padding: 20 }}>
            <Route
              path="/"
              exact
              render={props => (
                <Slots {...props} {...this.props} balance={balance} />
              )}
            />
            <Route
              path="/deposit"
              exact
              render={props => (
                <Deposit {...props} {...this.props} balance={balance} />
              )}
            />
            <Route
              path="/faucet"
              exact
              render={props => <Faucet {...props} {...this.props} />}
            />
          </div>
        </Layout.Content>
        <Layout.Footer>© PARSEC Labs {new Date().getFullYear()}</Layout.Footer>
      </Layout>
    );
  }
}

App.propTypes = {
  decimals: PropTypes.object.isRequired,
  account: PropTypes.string.isRequired,
  symbol: PropTypes.string.isRequired,
  balance: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

export default withRouter(App);
