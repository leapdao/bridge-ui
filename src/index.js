/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'mobx-react';

import { DEFAULT_NETWORK } from './utils';

import Tokens from './stores/tokens.ts';
import Bridge from './stores/bridge.ts';
import Account from './stores/account.ts';
import Network from './stores/network.ts';
import Transactions from './components/txNotification/transactions.ts';
import TxNotification from './components/txNotification/index.tsx';
import Explorer from './stores/explorer.ts';

import App from './components/app';

if (!process.env.BRIDGE_ADDR) {
  console.error(
    'Missing Bridge contract address. Please rebuild with BRIDGE_ADDR env variable set'
  );
}

const ADDR_REGEX = /0x[0-9a-fA-f]{40}/;

const transactions = new Transactions();
const account = new Account();
const bridge = new Bridge(account, transactions);
const tokens = new Tokens(account, bridge, transactions);
const network = new Network(account, process.env.NETWORK_ID || DEFAULT_NETWORK);
const explorer = new Explorer();

ReactDOM.render(
  <BrowserRouter>
    <Provider {...{ account, tokens, bridge, network, transactions, explorer }}>
      <Fragment>
        <TxNotification />
        <Route
          path="/"
          exact
          render={() => <Redirect to={`/${process.env.BRIDGE_ADDR}`} />}
        />
        <Route
          path="/:bridgeAddr"
          render={props => {
            const section = props.match.params.bridgeAddr;
            if (ADDR_REGEX.test(section)) {
              return <App {...props} />;
            }
            return (
              <Redirect
                to={`/${process.env.BRIDGE_ADDR}${props.location.pathname}`}
              />
            );
          }}
        />
      </Fragment>
    </Provider>
  </BrowserRouter>,
  document.getElementById('app')
);
