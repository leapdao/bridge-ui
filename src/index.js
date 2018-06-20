/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import App from './components/app';
import Web3Wrapper from './components/web3Wrapper';

ReactDOM.render(
  <BrowserRouter>
    <Web3Wrapper>
      <App />
    </Web3Wrapper>
  </BrowserRouter>,
  document.getElementById('app')
);
