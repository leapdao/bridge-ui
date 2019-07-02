/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { EventLog } from 'web3/types';
import Contract from 'web3/eth/contract';
import { isNFT, isNST } from '../utils';

import { web3RootStore } from './web3/root';
import { AccountStore } from './account';

function hexToAscii(hex) {
  hex = hex.replace('0x', '');
  let result = '';
  for (let n = 0; n < hex.length; n += 2) {
    result += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return result;
}

const defaultSymbol = (color, addr) => {
  if (isNST(color)) {
    return `NST${addr.substring(2, 5)}`;
  }

  if (isNFT(color)) {
    return `NFT${addr.substring(2, 5)}`;
  }

  return `T${addr.substring(2, 5)}`;
};

const bytesTokenABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'bytes32' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'bytes32' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

const tokenValue = (token: Contract, method: string) => {
  return token.methods[method]()
    .call()
    .then(
      a => a,
      () => {
        const bytesToken = new web3RootStore.instance.eth.Contract(
          bytesTokenABI,
          token.options.address
        );
        return bytesToken.methods[method]()
          .call()
          .then(hexToAscii);
      }
    )
    .catch(e => {
      console.warn(
        `Error executing method '${method}'. Probably ABI mismatches the bytecode`
      );
      return Promise.reject();
    });
};

export const tokenInfo = (
  token: Contract,
  color: number
): Promise<[string, string, string]> => {
  return Promise.all([
    tokenValue(token, 'symbol').catch(_ =>
      defaultSymbol(color, token.options.address)
    ),
    isNFT(color) ? Promise.resolve(0) : token.methods.decimals().call(),
    tokenValue(token, 'name').catch(_ =>
      defaultSymbol(color, token.options.address)
    ),
  ]);
};

export const isOurTransfer = (
  event: EventLog,
  ourAccount: AccountStore
): boolean => {
  const address = ourAccount.address || '';
  return (
    event.returnValues[0].toLowerCase() === address.toLowerCase() ||
    event.returnValues[1].toLowerCase() === address.toLowerCase()
  );
};
