/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import { reaction, observable, IObservableArray } from 'mobx';

import autobind from 'autobind-decorator';
import { range, toArray } from '../utils';
import { tokenGovernance } from '../utils/abis';
import { ContractStore } from './contractStore';
import { bridgeStore } from './bridge';
import { web3InjectedStore } from './web3/injected';
import { keccak256 } from 'ethereumjs-util';
import Contract from 'web3/eth/contract';
import { ABIDefinition, EthAbiDecodeParametersResultObject } from 'web3/types';
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

export class TokenGovernanceContractStore extends ContractStore {
  private funcBySignature: Map<string, ABIDefinition>;

  @observable
  public noGovernance: boolean;
  public props: any;
  public state: { title: string; description: string };
  public proposals: IObservableArray<Proposal>;

  constructor() {
    super(tokenGovernance, null);

    this.state = {
      title: '',
      description: '',
    };

    this.props = {
      title: '',
      description: '',
    };

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

  private calculateAbiSignatures(): Map<string, ABIDefinition> {
    return (tokenGovernance as ABIDefinition[])
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

  private fetch() {
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

  public get tokenGovernanceContract(): Contract | undefined {
    if (web3InjectedStore.instance) {
      return new web3InjectedStore.instance.eth.Contract(
        this.abi,
        '0x3cc955f91d645b4250f6070a8b7d71365662776f'
      );
    }
  }

  @autobind
  public async sendProposal() {
    console.log('Hello ?');
    const accounts = await web3InjectedStore.instance.eth.getAccounts();

    const proposalHashBuffer = keccak256(
      `${this.props.title}::${this.props.description}`
    );
    console.log(proposalHashBuffer);

    const proposalHash = `0x${Buffer.from(proposalHashBuffer).toString('hex')}`;
    console.log(proposalHash);

    const tx = this.tokenGovernanceContract.methods
      .registerProposal(proposalHash)
      .send({
        from: accounts[0],
      });

    this.watchTx(tx, 'send..', {
      message: 'send',
    });

    return tx;
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
  }
}

export const tokenGovernanceContractStore = new TokenGovernanceContractStore();
