/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import Web3 from 'web3';

let injectedWeb3;
let enablePromise;

export default () => {
  if (injectedWeb3) return Promise.resolve(injectedWeb3);

  // Handle privacy mode (EIP-1102)
  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  if (window.ethereum) {
    enablePromise =
      enablePromise ||
      window.ethereum
        .enable()
        .then(() => {
          injectedWeb3 = new Web3(window.ethereum);
          return injectedWeb3;
        })
        .catch(e => {
          // User denied account access...
          console.warn(e);
        });
    return enablePromise;
  }
  injectedWeb3 = new Web3(window.web3.currentProvider);
  return Promise.resolve(injectedWeb3);
};
