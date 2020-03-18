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

import { CONFIG_NAME } from './config';
import TxNotification from './components/txNotification';

import Explorer from './routes/explorer';
import Faucet from './routes/faucet';
import DenverFaucet from './routes/denverFaucet';
import Wallet from './routes/wallet';
import Slots from './routes/slots';
import RegisterToken from './routes/registerToken';
import Status from './routes/status';
import PlasmaGovernance from './routes/governance/plasma';
import TokenGovernance from './routes/governance/token';

const Home = require('./config/' + CONFIG_NAME + '/home.tsx').default;

ReactDOM.render(
  <BrowserRouter>
    <Fragment>
      <TxNotification />
      <Route path="/" exact component={Home} />
      <Route path="/governance" exact component={PlasmaGovernance} />
      <Route path="/governance/plasma" component={PlasmaGovernance} />
      <Route path="/governance/token" component={TokenGovernance} />
      <Route path="/slots" component={Slots} />
      <Route path="/:bridgeAddr(0x[0-9a-fA-f]{40})" exact component={Slots} />
      <Route path="/registerToken" exact component={RegisterToken} />
      <Route
        path="/registerToken/:bridgeAddr(0x[0-9a-fA-f]{40})"
        exact
        component={RegisterToken}
      />
      <Route path="/denver" component={DenverFaucet} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/explorer" component={Explorer} />
      <Route path="/faucet" component={Faucet} />
      <Route path="/status" component={Status} />
    </Fragment>
  </BrowserRouter>,
  document.getElementById('app')
);
