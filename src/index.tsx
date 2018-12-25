/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import 'antd/dist/antd.min.css';

import * as React from 'react';
import { Fragment } from 'react';
import * as ReactDOM from 'react-dom';
import { Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'mobx-react';

import { DEFAULT_NETWORK } from './utils';
import { CONFIG_NAME } from './config';

import Tokens from './stores/tokens';
import Operator from './stores/operator';
import ExitHandler from './stores/exitHandler';
import Bridge from './stores/bridge';
import Account from './stores/account';
import Network from './stores/network';
import ExplorerStore from './stores/explorer';
import Unspents from './stores/unspents';
import NodeStore from './stores/node';
import Web3Store from './stores/web3';
import GovernanceContract from './stores/governanceContract';

import Transactions from './components/txNotification/transactions';
import TxNotification from './components/txNotification';

import Explorer from './routes/explorer';
import Faucet from './routes/faucet';
import Wallet from './routes/wallet';
import Slots from './routes/slots';
import RegisterToken from './routes/registerToken';
import Status from './routes/status';
import Governance from './routes/governance';

const Home = require('./config/' + CONFIG_NAME + '/home.tsx').default;

const web3 = new Web3Store();
const transactions = new Transactions();
const account = new Account(web3);
const node = new NodeStore(web3);
const bridge = new Bridge(account, transactions, web3);
const operator = new Operator(transactions, web3);
const exitHandler = new ExitHandler(account, transactions, web3);
const tokens = new Tokens(account, exitHandler, transactions, node, web3);
const explorer = new ExplorerStore(node, web3, tokens);
const governanceContract = new GovernanceContract(bridge, transactions, web3);
const network = new Network(
  account,
  web3,
  process.env.NETWORK_ID || DEFAULT_NETWORK
);
const unspents = new Unspents(exitHandler, account, node, web3);

ReactDOM.render(
  <BrowserRouter>
    <Provider
      {...{
        account,
        tokens,
        bridge,
        operator,
        exitHandler,
        network,
        transactions,
        explorer,
        unspents,
        node,
        web3,
        governanceContract,
      }}
    >
      <Fragment>
        <TxNotification />
        <Route path="/" exact component={Home} />
        <Route path="/governance" component={Governance} />
        <Route path="/slots" component={Slots} />
        <Route path="/:bridgeAddr(0x[0-9a-fA-f]{40})" exact component={Slots} />
        <Route path="/registerToken" exact component={RegisterToken} />
        <Route
          path="/registerToken/:bridgeAddr(0x[0-9a-fA-f]{40})"
          exact
          component={RegisterToken}
        />
        <Route path="/wallet" component={Wallet} />
        <Route path="/explorer" component={Explorer} />
        <Route path="/faucet" component={Faucet} />
        <Route path="/status" component={Status} />
      </Fragment>
    </Provider>
  </BrowserRouter>,
  document.getElementById('app')
);
