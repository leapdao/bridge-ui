/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import getWeb3 from '../utils/getWeb3';
import { bridge as bridgeAbi, token as tokenAbi } from '../utils/abis';
import { range } from '../utils';

const tokenInfo = address => {
  const iWeb3 = getWeb3(true);
  const token = new iWeb3.eth.Contract(tokenAbi, address);
  return Promise.all([
    token.methods.symbol().call(),
    token.methods.decimals().call(),
    token.methods.name().call(),
  ]).then(([symbol, decimals, name]) => ({
    address,
    symbol,
    decimals: Number(decimals),
    name,
  }));
};

export default bridgeAddress => {
  const iWeb3 = getWeb3(true);
  const bridge = new iWeb3.eth.Contract(bridgeAbi, bridgeAddress);
  return bridge.methods
    .tokenCount()
    .call()
    .then(tokenCount =>
      Promise.all(
        range(0, tokenCount - 1).map(pos =>
          bridge.methods
            .tokens(pos)
            .call()
            .then(tokenRecord => tokenRecord[0])
            .then(tokenInfo)
            .then(token => Object.assign(token, { color: pos }))
        )
      )
    );
};
