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
import ExplorerStore from './stores/explorer.ts';
import Unspents from './stores/unspents.ts';

import Transactions from './components/txNotification/transactions.ts';
import TxNotification from './components/txNotification/index.tsx';

import App from './components/app';
import Explorer from './routes/explorer';

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
const unspents = new Unspents(bridge, account);
const explorer = new ExplorerStore();

ReactDOM.render(
  <BrowserRouter>
    <Provider
      {...{
        account,
        tokens,
        bridge,
        network,
        transactions,
        explorer,
        unspents,
      }}
    >
      <Fragment>
        <TxNotification />
        <Route
          path="/"
          exact
          render={() => <Redirect to={`/${process.env.BRIDGE_ADDR}`} />}
        />
        <Route path="/explorer" exact component={Explorer} />
        <Route
          path="/explorer/:search"
          render={props => {
            explorer.search(props.match.params.search);
            return <Explorer />;
          }}
        />
        <Route
          path="/:bridgeAddr"
          render={props => {
            const section = props.match.params.bridgeAddr;
            if (ADDR_REGEX.test(section)) {
              return <App {...props} />;
            }
            if (section !== 'explorer') {
              return (
                <Redirect
                  to={`/${process.env.BRIDGE_ADDR}${props.location.pathname}`}
                />
              );
            }

            return null;
          }}
        />
      </Fragment>
    </Provider>
  </BrowserRouter>,
  document.getElementById('app')
);
