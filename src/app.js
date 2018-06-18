/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Route } from 'react-router'; // eslint-disable-line
import { Link } from 'react-router-dom'; // eslint-disable-line
import Slots from './routes/slots'; // eslint-disable-line
import Deposit from './routes/deposit'; // eslint-disable-line
import Faucet from './routes/faucet'; // eslint-disable-line
import promisifyWeb3Call from './promisifyWeb3Call';
import getWeb3 from './getWeb3';
import { token as tokenAbi, bridge as bridgeAbi } from './abis';
import { tokenAddress, bridgeAddress } from './addrs';

export default class App extends React.Component {
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
    Promise.all([
      promisifyWeb3Call(this.token.balanceOf, account),
      promisifyWeb3Call(this.bridge.lastCompleteEpoch),
    ]).then(([balance, lastCompleteEpoch]) => {
      this.setState({ balance, lastCompleteEpoch });
    });
  }

  render() {
    const { balance, lastCompleteEpoch } = this.state;
    const { decimals, symbol } = this.props;
    if (!balance) {
      return null;
    }
    return (
      <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 15 }}>
        <p>
          Balance: {Number(balance.div(decimals))} {symbol}
        </p>
        <p>Last complete epoch: {Number(lastCompleteEpoch)}</p>
        <Link to="/">Slots auction</Link>
        {' | '}
        <Link to="/deposit">Make deposit</Link>
        {' | '}
        <Link to="/faucet">Get tokens</Link>
        <hr />
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
    );
  }
}
