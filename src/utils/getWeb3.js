/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 from 'web3';
import { NETWORKS, DEFAULT_NETWORK } from '.';

let web3;
let injectedWeb3;

export default (injected = false) => {
  if (!injected && !web3) {
    const network = NETWORKS[process.env.NETWORK_ID || DEFAULT_NETWORK];
    web3 = new Web3(network.provider);
  }

  if (injected && !injectedWeb3) {
    injectedWeb3 = new Web3(window.web3.currentProvider);
  }

  return injected ? injectedWeb3 : web3;
};
