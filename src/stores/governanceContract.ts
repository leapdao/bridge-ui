/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import { reaction, observable, IObservableArray, computed } from 'mobx';

import {
  ABIDefinition,
  EthAbiDecodeParametersResultObject,
} from 'web3/eth/abi';
import autobind from 'autobind-decorator';

import { range, toArray } from '../utils';
import {
  governance as governanceAbi,
  governable as governableAbi,
} from '../utils/abis';
import { ContractStore } from './contractStore';
import { bridgeStore } from './bridge';
import { web3InjectedStore } from './web3/injected';
import { web3RootStore } from './web3/root';
import { exitHandlerStore } from './exitHandler';
import { operatorStore } from './operator';

type ABIDefinitionBySig = Map<string, ABIDefinition>;

type DecodedMessage = {
  abi?: ABIDefinition;
  params?: EthAbiDecodeParametersResultObject;
  raw: string;
};

type Proposal = {
  num: number;
  cancelled: boolean;
  created: number;
  effectiveDate: number;
  msg: DecodedMessage;
  subject;
  methodStr: string;
  summaryStr: string;
  newValue?: string[];
  currentValue?: string;
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
    contract: 'proxy',
  },
  changeAdmin: {
    name: 'Introduce new governance process',
    contract: 'proxy',
    getter: 'admin',
  },
  setSlot: {
    name: 'Set validating slot to PoA node',
    contract: 'operator',
    getter: (contract, params) =>
      contract.methods
        .slots(params[0])
        .call()
        .then(res => `${res.signer}, ${res.tendermint}`),
  },
};

export class GovernanceContractStore extends ContractStore {
  public funcBySignature: Map<string, ABIDefinition>;

  @observable
  public proposals: IObservableArray<Proposal>;

  @computed
  public get canFinalize(): boolean {
    return (
      this.proposals &&
      this.proposals.filter(proposal => {
        const date = new Date();
        return proposal.effectiveDate <= date.getTime();
      }).length > 0
    );
  }

  @observable
  public noGovernance: boolean;

  constructor() {
    super(governanceAbi, null);

    reaction(
      () => bridgeStore.contract,
      () => {
        bridgeStore.contract.methods
          .admin()
          .call()
          .then(owner => {
            this.address = owner;
            this.funcBySignature = this.calculateAbiSignatures();
            this.fetch();
          });
      }
    );
  }

  @autobind
  public async finalize() {
    if (!this.iContract) {
      console.error('Need injected web3 to finalize');
      return;
    }
    const accounts = await web3InjectedStore.instance.eth.getAccounts();
    const tx = this.iContract.methods.finalize().send({
      from: accounts[0],
    });

    this.watchTx(tx, 'finalize', {
      message: 'Finalize proposals',
    });

    return tx;
  }

  private readCurrentValue(proposal, governanceChange) {
    if (governanceChange.getter) {
      if (governanceChange.contract === 'proxy') {
        const proxy = new web3RootStore.instance.eth.Contract(
          governableAbi,
          proposal.subject
        );
        return proxy.methods[governanceChange.getter]().call();
      }
      if (typeof governanceChange.getter === 'function') {
        return governanceChange.getter(
          this[governanceChange.contract].contract,
          proposal.msg.params
        );
      } else {
        return this[governanceChange.contract].contract.methods[
          governanceChange.getter
        ]().call();
      }
    }
    return Promise.resolve('');
  }

  private proposalParamsStr(
    params: EthAbiDecodeParametersResultObject
  ): string {
    return toArray(params).join(', ');
  }

  private proposalMethodStr(msg: DecodedMessage): string {
    if (!msg.abi) {
      return msg.raw;
    }
    return `${msg.abi.name}(${this.proposalParamsStr(msg.params)})`;
  }

  private lookupContractType(subject): string {
    const normalizedSubject = subject.toLowerCase();
    if (exitHandlerStore.address.toLowerCase() === normalizedSubject) {
      return 'ExitHandler';
    }
    if (bridgeStore.address.toLowerCase() === normalizedSubject) {
      return 'Bridge';
    }
    if (operatorStore.address.toLowerCase() === normalizedSubject) {
      return 'Operator';
    }
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

    if (!msg.abi) {
      return Promise.resolve({
        ...proposal,
        summaryStr: 'Unrecognized proposal',
      });
    }

    const governanceChange = governanceParams[msg.abi.name];

    if (!governanceChange) {
      return Promise.resolve({
        ...proposal,
        summaryStr: msg.abi.name,
        newValue: toArray(msg.params),
      });
    }

    return this.readCurrentValue(proposal, governanceChange).then(
      currentValue => ({
        ...proposal,
        summaryStr: governanceChange.name,
        newValue: toArray(msg.params),
        currentValue,
      })
    );
  }

  public fetch() {
    return Promise.all([
      this.contract.methods.first().call(),
      this.contract.methods.size().call(),
      this.contract.methods.proposalTime().call(),
    ])
      .then(([first, size, proposalTime]) => {
        return Promise.all(
          (range(
            Number(first),
            Number(first) - 1 + Number(size)
          ) as number[]).map(index => {
            return this.contract.methods
              .proposals(`${index}`)
              .call()
              .then(proposalData =>
                this.enrichProposal(proposalData, index, proposalTime)
              );
          })
        ).then(proposals => {
          this.proposals = observable.array(proposals);
        });
      })
      .catch(e => {
        console.error('err', e);
        // TODO: add better "no governance" detection
        this.noGovernance = true;
      });
  }

  private decodeMsgData(msgData: string): DecodedMessage {
    const sig = msgData.substring(0, 10);
    const abiDef = this.funcBySignature[sig];
    if (!abiDef) {
      return { raw: msgData }; // unsupported method, probably ABI mismatch
    }
    return {
      abi: abiDef,
      params: web3RootStore.instance.eth.abi.decodeParameters(
        abiDef.inputs,
        msgData.substring(10)
      ),
      raw: msgData,
    };
  }

  public calculateAbiSignatures(): Map<string, ABIDefinition> {
    return (governableAbi as ABIDefinition[])
      .filter(m => m.type === 'function')
      .reduce<ABIDefinitionBySig>(
        (m: ABIDefinitionBySig, def: ABIDefinition) => {
          const sig = web3RootStore.instance.eth.abi.encodeFunctionSignature(
            def
          );
          m[sig] = def;
          return m;
        },
        new Map()
      );
  }
}

export const governanceContractStore = new GovernanceContractStore();
