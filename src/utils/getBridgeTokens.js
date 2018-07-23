/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import getWeb3 from '../utils/getWeb3';
import { bridge as bridgeAbi, token as tokenAbi } from '../utils/abis';
import { range } from '../utils';

export default async bridgeAddress => {
  const iWeb3 = getWeb3(true);
  const bridge = new iWeb3.eth.Contract(bridgeAbi, bridgeAddress);
  const tokenCount = await bridge.methods.tokenCount().call();
  const tokensPromises = range(0, tokenCount - 1).map(async pos => {
    const tokenRecord = await bridge.methods.tokens(pos).call();
    const token = new iWeb3.eth.Contract(tokenAbi, tokenRecord[0]);
    const [symbol, decimals, name] = await Promise.all([
      token.methods.symbol().call(),
      token.methods.decimals().call(),
      token.methods.name().call(),
    ]);
    return {
      address: tokenRecord[0],
      symbol,
      decimals: Number(decimals),
      name,
      color: pos,
    };
  });
  return Promise.all(tokensPromises);
};
