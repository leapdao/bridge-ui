/**
 * Copyright (c) 2020-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { tokenGovernance as tokenGovernanceAbi } from '../../utils/abis';
import { ContractStore } from '../contractStore';
import { CONFIG } from '../../config';

export class TokenGovernanceContract extends ContractStore {
  constructor() {
    super(tokenGovernanceAbi, CONFIG.tokenGovernanceAddress);
  }
}

export const tokenGovernance = new TokenGovernanceContract();
