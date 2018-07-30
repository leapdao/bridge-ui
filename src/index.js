/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
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

const getBridgeAddress = () => {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('0x') && hash.length === 42) {
    return hash;
  }

  return process.env.BRIDGE_ADDR;
};

const account = new Account();
const tokens = new Tokens(account, getBridgeAddress());
const bridge = new Bridge(account, getBridgeAddress());
const network = new Network(account, process.env.NETWORK_ID || DEFAULT_NETWORK);

ReactDOM.render(
  <BrowserRouter>
    <Provider {...{ account, tokens, bridge, network }}>
      <App />
    </Provider>
  </BrowserRouter>,
  document.getElementById('app')
);
