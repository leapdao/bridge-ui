/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import Web3Store from './web3';
import { ABIDefinition } from 'web3/Eth/ABI';
import { range } from '../utils';
import { 
  governance as governanceAbi,
  governable as governableAbi 
} from '../utils/abis';
import ContractStore from './contractStore';
import Transactions from '../components/txNotification/transactions';

type ABIDefinitionBySig = Map<String, ABIDefinition>;

export default class GovernanceContract extends ContractStore {
  private funcBySignature: Map<String, ABIDefinition>;

  constructor(address: string, transactions: Transactions, web3: Web3Store) {
    super(governanceAbi, address, transactions, web3);
    this.funcBySignature = this.calculateAbiSignatures();
  }

  list() {
    return Promise.all([
      this.contract.methods.first().call(),
      this.contract.methods.size().call(),
      this.contract.methods.proposalTime().call(),
    ]).then(([first, size, proposalTime]) => {
      return Promise.all(
        (range(Number(first), Number(first) - 1 + Number(size)) as number[]).map(index => {
          return this.contract.methods
            .proposals(`${index}`)
            .call()
            .then(({ created, msgData, canceled }) => ({
              num: index,
              cancelled: canceled, // Grammar police 👮‍♂️
              created: Number(created) * 1000,
              effectiveDate: (Number(created) + Number(proposalTime)) * 1000,
              msg: this.decodeMsgData(msgData)
            }));
        })  
      );
    });
  }

  private decodeMsgData(msgData: string) {
    const sig = msgData.substring(0, 10);
    const abiDef = this.funcBySignature[sig];
    if (!abiDef) return { raw: msgData }; // unsupported method, probably ABI mismatch
    return {
      abi: abiDef,
      params: this.web3.local.eth.abi.decodeParameters(abiDef.inputs, msgData.substring(10)),
    };
  }

  private calculateAbiSignatures(): Map<String, ABIDefinition> {
    return (governableAbi as ABIDefinition[])
      .filter(m => m.type === 'function')
      .reduce<ABIDefinitionBySig>(
        (m: ABIDefinitionBySig, def: ABIDefinition) => {
          const sig = this.web3.local.eth.abi.encodeFunctionSignature(def);
          console.log(sig, def.name);
          m[sig] = def;
          return m;
        },
        new Map()
      );
  }
}
