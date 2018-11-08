/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
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
import NodeStore from './stores/node.ts';
import Web3Store from './stores/web3.ts';

import Transactions from './components/txNotification/transactions.ts';
import TxNotification from './components/txNotification/index.tsx';

import App from './components/app';
import Explorer from './routes/explorer';
import Faucet from './routes/faucet';

if (!process.env.BRIDGE_ADDR) {
  /* eslint-disable no-console */
  console.error(
    'Missing Bridge contract address. Please rebuild with BRIDGE_ADDR env variable set'
  );
  /* eslint-enable no-console */
}

const ADDR_REGEX = /0x[0-9a-fA-f]{40}/;

const web3 = new Web3Store();
const transactions = new Transactions();
const account = new Account(web3);
const node = new NodeStore(web3);
const bridge = new Bridge(account, transactions, web3);
const explorer = new ExplorerStore(node, web3);
const tokens = new Tokens(account, bridge, transactions, node, web3);
const network = new Network(
  account,
  web3,
  process.env.NETWORK_ID || DEFAULT_NETWORK
);
const unspents = new Unspents(bridge, account, node, web3);

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
        node,
        web3,
      }}
    >
      <Fragment>
        <TxNotification />
        <Route
          path="/"
          exact
          render={() => <Redirect to={`/${process.env.BRIDGE_ADDR}`} />}
        />
        <Route path="/explorer" component={Explorer} />
        <Route path="/faucet" component={Faucet} />
        <Route
          path="/:bridgeAddr"
          render={props => {
            const section = props.match.params.bridgeAddr;
            if (ADDR_REGEX.test(section)) {
              return <App {...props} />;
            }
            if (section !== 'explorer' && section !== 'faucet') {
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
