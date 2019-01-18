/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import { reaction, observable, IObservableArray } from 'mobx';

import Web3Store from './web3/';
import { ABIDefinition, EthAbiDecodeParametersResultObject } from 'web3/eth/abi';

import { range, toArray } from '../utils';
import { 
  governance as governanceAbi,
  governable as governableAbi,
} from '../utils/abis';
import ContractStore from './contractStore';
import Bridge from './bridge';
import Transactions from '../components/txNotification/transactions';
import ExitHandler from './exitHandler';
import Operator from './operator';

type ABIDefinitionBySig = Map<String, ABIDefinition>;

type DecodedMessage = { 
  abi?: ABIDefinition,
  params?: EthAbiDecodeParametersResultObject, 
  raw: string
};

type Proposal = {
  num: number,
  cancelled: boolean,
  created: number,
  effectiveDate: number,
  msg: DecodedMessage,
  subject,
  methodStr: string,
  summaryStr: string,
  newValue?: string,
  currentValue?: string,
};

const governanceParams = {
  setOperator: {
    name: 'Change the block submission logic with a new contract',
    contract: 'bridge',
    getter: 'operator',
  },
  setEpochLength: {
    name: 'Set epoch length',
    contract: 'operator',
    getter: 'epochLength',
  },
  setExitStake: {
    name: 'Set exit stake',
    contract: 'exitHandler',
    getter: 'exitStake',
  },
  setParentBlockInterval: {
    name: 'Set parent block interval',
    contract: 'bridge',
    getter: 'parentBlockInterval',
  },
  registerToken: {
    name: 'Register a new token: ',
    contract: 'exitHandler',
  },
  upgradeTo: {
    name: 'Upgrade contract logic',
    contract: 'proxy'
  },
  changeAdmin: {
    name: 'Introduce new governance process',
    contract: 'proxy',
    getter: 'admin'
  },
  setSlot: {
    name: 'Set validating slot to PoA node',
    contract: 'operator',
    getter: (contract, params) => 
      contract.methods.slots(params[0]).call()
        .then(res => `${res.signer}, ${res.tendermint}`),
  }
};

export default class GovernanceContract extends ContractStore {
  private funcBySignature: Map<String, ABIDefinition>;

  @observable
  public proposals: IObservableArray<Proposal>;

  @observable
  public noGovernance: boolean;

  constructor(
    private bridge: Bridge,
    private operator: Operator,
    private exitHandler: ExitHandler,
    transactions: Transactions,
    web3: Web3Store) {
    super(governanceAbi, null, transactions, web3);

    reaction(
      () => bridge.contract,
      () => {
        bridge.contract.methods.admin().call().then((owner) => {
          this.address = owner;
          this.funcBySignature = this.calculateAbiSignatures();
          this.fetch();
        })
      }
    );
  }

  private readCurrentValue(proposal, governanceChange) {
    if (governanceChange.getter) {
      if (governanceChange.contract === 'proxy') {
        const proxy = new this.web3.root.instance.eth.Contract(governableAbi, proposal.subject);
        return proxy.methods[governanceChange.getter]().call();
      }
      if (typeof governanceChange.getter === 'function') {
        return governanceChange.getter(this[governanceChange.contract].contract, proposal.msg.params);
      } else {
        return this[governanceChange.contract].contract.methods[governanceChange.getter]().call();
      }
    }
    return Promise.resolve('');
  }

  private proposalParamsStr(params: EthAbiDecodeParametersResultObject): string {
    return toArray(params).join(', ');
  }

  private proposalMethodStr(msg: DecodedMessage): string {
    if (!msg.abi) return msg.raw;
    return `${msg.abi.name}(${this.proposalParamsStr(msg.params)})`;
  }

  private lookupContractType(subject): string {
    const normalizedSubject = subject.toLowerCase();
    if (this.exitHandler.address.toLowerCase() === normalizedSubject) return 'ExitHandler';
    if (this.bridge.address.toLowerCase() === normalizedSubject) return 'Bridge';
    if (this.operator.address.toLowerCase() === normalizedSubject) return 'Operator';
    return 'Unknown';
  } 

  private enrichProposal(data, index, proposalTime): Promise<Proposal> {
    const msg = this.decodeMsgData(data.msgData);
    const methodStr = this.proposalMethodStr(msg);
    const proposal = {
      num: index,
      cancelled: data.canceled, // Grammar police 👮‍
      created: Number(data.created) * 1000,
      effectiveDate: (Number(data.created) + Number(proposalTime)) * 1000,
      msg,
      methodStr,
      subject: data.subject,
      subjectType: this.lookupContractType(data.subject),
    };

    if (!msg.abi) return Promise.resolve({
      ...proposal,
      summaryStr: 'Unrecognized proposal',
    });

    const governanceChange = governanceParams[msg.abi.name];

    if (!governanceChange) return Promise.resolve({
      ...proposal,
      summaryStr: msg.abi.name,
      newValue: this.proposalParamsStr(msg.params),
    });

    return this.readCurrentValue(proposal, governanceChange).then(currentValue => ({
      ...proposal,
      summaryStr: governanceChange.name,
      newValue: this.proposalParamsStr(msg.params),
      currentValue,
    }));
  }

  private fetch() {
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
            .then(proposalData => this.enrichProposal(proposalData, index, proposalTime));
        })  
      ).then(proposals => {
        this.proposals = observable.array(proposals);
      });
    }).catch(e => {
      console.error('err', e);
      // TODO: add better "no governance" detection
      this.noGovernance = true;
    });
  }

  private decodeMsgData(msgData: string): DecodedMessage {
    const sig = msgData.substring(0, 10);
    const abiDef = this.funcBySignature[sig];
    if (!abiDef) return { raw: msgData }; // unsupported method, probably ABI mismatch
    return {
      abi: abiDef,
      params: this.web3.root.instance.eth.abi.decodeParameters(abiDef.inputs, msgData.substring(10)),
      raw: msgData,
    };
  }

  private calculateAbiSignatures(): Map<String, ABIDefinition> {
    return (governableAbi as ABIDefinition[])
      .filter(m => m.type === 'function')
      .reduce<ABIDefinitionBySig>(
        (m: ABIDefinitionBySig, def: ABIDefinition) => {
          const sig = this.web3.root.instance.eth.abi.encodeFunctionSignature(def);
          m[sig] = def;
          return m;
        },
        new Map()
      );
  }
}
