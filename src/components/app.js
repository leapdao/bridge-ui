/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import 'antd/dist/antd.css';

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Route, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import MediaQuery from 'react-responsive';
import { Dropdown, Icon, Layout, Menu } from 'antd';

import Slots from '../routes/slots';
import Deposit from '../routes/deposit';
import Faucet from '../routes/faucet';
import RegisterToken from '../routes/registerToken';
import Info from '../routes/info';
import promisifyWeb3Call from '../utils/promisifyWeb3Call';
import getWeb3 from '../utils/getWeb3';
import { token as tokenAbi, bridge as bridgeAbi } from '../utils/abis';
import { bridgeAddress } from '../utils/addrs';
import Web3SubmitWrapper from '../components/web3SubmitWrapper';

import parsecLabsLogo from '../parseclabs.svg';

import '../style.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: null,
    };
  }

  componentDidMount() {
    if (window.web3) {
      const { tokenAddress } = this.props;
      this.token = getWeb3(true)
        .eth.contract(tokenAbi)
        .at(tokenAddress);
      this.bridge = getWeb3(true)
        .eth.contract(bridgeAbi)
        .at(bridgeAddress);

      const bridgeEvents = this.bridge.allEvents({ toBlock: 'latest' });
      bridgeEvents.watch(() => {
        if (this.props.account) {
          this.loadData(this.props.account);
        }
      });

      const transferEvents = this.token.Transfer({ toBlock: 'latest' });
      transferEvents.watch((err, e) => {
        if (e.args.to === this.props.account) {
          this.loadData(this.props.account);
        }
      });
    }

    if (this.props.account) {
      this.loadData(this.props.account);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.account !== nextProps.account) {
      this.loadData(nextProps.account);
    }
  }

  loadData(account) {
    if (this.token) {
      Promise.all([promisifyWeb3Call(this.token.balanceOf, account)]).then(
        ([balance]) => {
          this.setState({ balance });
        }
      );
    }
  }

  render() {
    const { balance } = this.state;
    const { decimals, symbol, account, network } = this.props;

    const menu = horizontal => (
      <Menu
        selectedKeys={[this.props.location.pathname]}
        mode={horizontal ? 'horizontal' : 'vertical'}
        style={{ lineHeight: '64px', width: '100%' }}
      >
        <Menu.Item key="/">
          <Link to="/">Slots auction</Link>
        </Menu.Item>
        <Menu.Item key="/deposit">
          <Link to="/deposit">Make deposit</Link>
        </Menu.Item>
        <Menu.Item key="/registerToken">
          <Link to="/registerToken">Register token</Link>
        </Menu.Item>
        <Menu.Item key="/faucet">
          <Link to="/faucet">Get tokens</Link>
        </Menu.Item>
        <Menu.Item key="/info">
          <Link to="/info">Chain info</Link>
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
              <Web3SubmitWrapper account={account} network={network}>
                {canSubmitTx =>
                  canSubmitTx &&
                  balance && (
                    <Fragment>
                      Balance:{' '}
                      <strong>
                        {Number(balance.div(decimals))} {symbol}
                      </strong>
                    </Fragment>
                  )
                }
              </Web3SubmitWrapper>
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
              path="/registerToken"
              exact
              render={props => <RegisterToken {...props} {...this.props} />}
            />
            <Route
              path="/faucet"
              exact
              render={props => <Faucet {...props} {...this.props} />}
            />
            <Route
              path="/info"
              exact
              render={props => <Info {...props} {...this.props} />}
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
  account: PropTypes.string,
  symbol: PropTypes.string.isRequired,
  tokenAddress: PropTypes.string.isRequired,
  network: PropTypes.string.isRequired,
  location: PropTypes.object.isRequired,
};

export default withRouter(App);
