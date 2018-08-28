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

import App from './components/app';

if (!process.env.BRIDGE_ADDR) {
  console.error(
    'Missing Bridge contract address. Please rebuild with BRIDGE_ADDR env variable set'
  );
}

const account = new Account();
const bridge = new Bridge(account);
const tokens = new Tokens(account, bridge);
const network = new Network(account, process.env.NETWORK_ID || DEFAULT_NETWORK);

ReactDOM.render(
  <BrowserRouter>
    <Provider {...{ account, tokens, bridge, network }}>
      <Fragment>
        <Route
          path="/"
          exact
          render={() => <Redirect to={`/${process.env.BRIDGE_ADDR}`} />}
        />
        <Route path="/:bridgeAddr" component={App} />
      </Fragment>
    </Provider>
  </BrowserRouter>,
  document.getElementById('app')
);
