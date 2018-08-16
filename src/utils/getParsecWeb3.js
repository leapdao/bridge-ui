/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 from 'web3';
import { PNODES, DEFAULT_PNODE } from '.';

let web3;

export default () => {
  if (!web3) {
    const node = PNODES[process.env.PNODE || DEFAULT_PNODE];
    web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider(node));
  }
  return web3;
};
