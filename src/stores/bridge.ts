/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { bridge as bridgeAbi } from '../utils/abis';

import ContractStore from './contractStore';
import Transactions from '../components/txNotification/transactions';

import Web3Store from './web3';

export default class Bridge extends ContractStore {

  constructor(
    transactions: Transactions,
    web3: Web3Store,
    address?: string
  ) {
    super(bridgeAbi, address, transactions, web3);

    web3.plasma.getConfig().then(({ bridgeAddr }) => {
      this.address = bridgeAddr;
    });
  }

}
