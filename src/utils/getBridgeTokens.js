/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import getWeb3 from '../utils/getWeb3';
import promisifyWeb3Call from '../utils/promisifyWeb3Call';
import { bridge as bridgeAbi, token as tokenAbi } from '../utils/abis';
import { bridgeAddress } from '../utils/addrs';
import { range } from '../utils';

export default async () => {
  const web3 = getWeb3(true);
  const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);
  const tokenCount = await promisifyWeb3Call(bridge.tokenCount);
  const tokensPromises = range(1, tokenCount - 1).map(async pos => {
    const tokenRecord = await promisifyWeb3Call(bridge.tokens, pos);
    const token = web3.eth.contract(tokenAbi).at(tokenRecord[0]);
    const [symbol, decimals] = await Promise.all([
      promisifyWeb3Call(token.symbol),
      promisifyWeb3Call(token.decimals),
    ]);
    return {
      address: tokenRecord[0],
      symbol,
      decimals: Number(decimals),
      color: pos,
    };
  });
  return Promise.all(tokensPromises);
};
