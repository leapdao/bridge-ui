/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 from 'web3';
import { PARSEC_NODES, DEFAULT_PARSEC_NODE } from '.';

let web3;

export default () => {
  if (!web3) {
    const node = PARSEC_NODES[process.env.PARSEC_NODE || DEFAULT_PARSEC_NODE];
    web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider(node));
  }
  return web3;
};
