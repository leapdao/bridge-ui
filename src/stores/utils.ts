/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { EventLog } from 'web3/types';
import Contract from 'web3/eth/contract';
import { isNFT } from '../utils';

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
    );
};

export const tokenInfo = (
  token: Contract,
  color: number
): Promise<[string, string, string]> => {
  return Promise.all([
    tokenValue(token, 'symbol'),
    isNFT(color) ? Promise.resolve(0) : token.methods.decimals().call(),
    tokenValue(token, 'name'),
  ]);
};

export const isOurTransfer = (
  event: EventLog,
  ourAccount: AccountStore
): boolean => {
  return (
    event.returnValues[0].toLowerCase() === ourAccount.address.toLowerCase() ||
    event.returnValues[1].toLowerCase() === ourAccount.address.toLowerCase()
  );
};
