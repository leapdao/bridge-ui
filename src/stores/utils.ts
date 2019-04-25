/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { EventLog } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { isNFT } from '../utils';

import Account from './account';
import Web3Store from './web3/';

function hexToAscii(hex) {
  hex = hex.replace('0x', '');
  let result = '';
  for (var n = 0; n < hex.length; n += 2) {
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
] as AbiItem[];

const tokenValue = (web3: Web3Store, token: Contract, method: string) => {
  return token.methods[method]()
    .call()
    .then(
      a => a,
      () => {
        const bytesToken = new web3.root.instance.eth.Contract(
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
  web3: Web3Store,
  token: Contract,
  color: number
): Promise<[string, string, string]> => {
  return Promise.all([
    tokenValue(web3, token, 'symbol'),
    isNFT(color) ? Promise.resolve(0) : token.methods.decimals().call(),
    tokenValue(web3, token, 'name'),
  ]);
};

export const isOurTransfer = (
  event: EventLog,
  ourAccount: Account
): boolean => {
  return (
    event.returnValues[0].toLowerCase() === ourAccount.address.toLowerCase() ||
    event.returnValues[1].toLowerCase() === ourAccount.address.toLowerCase()
  );
};
