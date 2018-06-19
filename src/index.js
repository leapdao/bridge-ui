/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React from 'react'; // eslint-disable-line
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom'; // eslint-disable-line

import * as abis from './abis';
import App from './app'; // eslint-disable-line
import getWeb3 from './getWeb3';
import promisifyWeb3Call from './promisifyWeb3Call';
import { tokenAddress } from './addrs';

if (!window.web3) {
  alert('You need to instal MetaMask first'); // eslint-disable-line
}

const token = getWeb3()
  .eth.contract(abis.token)
  .at(tokenAddress);

Promise.all([
  promisifyWeb3Call(window.web3.eth.getAccounts),
  promisifyWeb3Call(token.decimals),
  promisifyWeb3Call(token.symbol),
  promisifyWeb3Call(getWeb3().version.getNetwork),
]).then(([accounts, decimals, symbol, network]) => {
  const web3 = getWeb3();
  ReactDOM.render(
    <BrowserRouter>
      <App
        account={accounts[0]}
        decimals={new web3.BigNumber(10).pow(decimals)}
        symbol={symbol}
        network={network}
      />
    </BrowserRouter>,
    document.getElementById('app')
  );
});
