/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 from 'web3';
import { NETWORKS, DEFAULT_NETWORK } from '.';

let web3;

export default () => {
  if (web3) return web3;

  const network = NETWORKS[process.env.NETWORK_ID || DEFAULT_NETWORK];
  web3 = new Web3(new Web3.providers.HttpProvider(network.provider));

  return web3;
};
