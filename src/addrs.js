/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

if (!process.env.BRIDGE_ADDR) {
  console.error(
    'Missing Bridge contract address. Please rebuild with BRIDGE_ADDR env variable set'
  );
}
if (!process.env.TOKEN_ADDR) {
  console.error(
    'Missing token contract address. Please rebuild with TOKEN_ADDR env variable set'
  );
}
export const bridgeAddress = process.env.BRIDGE_ADDR;
export const tokenAddress = process.env.TOKEN_ADDR;
