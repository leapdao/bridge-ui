import { when, observable, action } from 'mobx';
import autobind from 'autobind-decorator';
import { EventEmitter } from 'events';

import { tokenGovernance } from '../contracts/tokenGovernance';
import { Proposal, IStoredProposalData } from './proposal';
import { web3InjectedStore } from '../web3/injected';
import { bridgeStore } from '../bridge';
import * as IPFS from '../ipfs';

const { hexToCid, cidToHex } = IPFS;

export enum ProposalLifecycle {
  IPFS_UPLOAD = 'proposal:ipfsUpload',
  SUBMIT_TO_CONTRACT = 'proposal:submitToContract',
  CREATED = 'proposal:created',
  FAILED_TO_CREATE = 'proposal:failedToCreate',
}

export class ProposalStore {
  @observable
  public proposals: Proposal[] = observable.array([]);

  @observable
  public loading: boolean;

  constructor() {
    when(() => !!bridgeStore.contract, this.loadAll);
  }

  private async storeToIPFS(
    title: string,
    description: string,
    progress: EventEmitter
  ): Promise<string> {
    progress.emit(ProposalLifecycle.IPFS_UPLOAD, { title });
    console.log('Storing proposal to IPFS:', { title, description });
    const ipfsHash = await IPFS.add(JSON.stringify({ title, description }));
    const proposalHash = cidToHex(ipfsHash);
    console.log('Stored', { proposalHash, ipfsHash });
    return proposalHash;
  }

  private async submitToContract(
    title: string,
    hash: string,
    progress: EventEmitter
  ) {
    progress.emit(ProposalLifecycle.SUBMIT_TO_CONTRACT, { title, hash });
    const [from] = await web3InjectedStore.instance.eth.getAccounts();
    const tx = tokenGovernance.iContract.methods
      .registerProposal(hash)
      .send({ from });

    tokenGovernance.watchTx(tx, 'registerProposal', {
      message:
        'Registering token governance proposal. ' +
        'A stake of 5000 LEAP will be deducted from your account',
    });

    return tx;
  }

  public async create(
    title: string,
    description: string,
    progress: EventEmitter = new EventEmitter()
  ): Promise<Proposal> {
    const hash = await this.storeToIPFS(title, description, progress);

    return this.submitToContract(title, hash, progress)
      .then(_ => {
        const proposal = new Proposal({ title, description, hash });
        progress.emit(ProposalLifecycle.CREATED, proposal);
        this.loadAll();
        return proposal;
      })
      .catch(e => {
        console.error(e);
        progress.emit(ProposalLifecycle.FAILED_TO_CREATE, { title });
        return null;
      });
  }

  @autobind
  @action
  private async loadAll() {
    this.loading = true;
    console.log('Reading proposals..');
    const fromBlock = await bridgeStore.genesisBlockNumber;
    const events = await tokenGovernance.contract.getPastEvents(
      'ProposalRegistered',
      { fromBlock }
    );

    this.proposals = observable.array(
      await Promise.all(
        events.map(async ({ returnValues }) => {
          const { proposalHash, initiator } = returnValues;
          const {
            openTime,
            finalized,
            yesVotes,
            noVotes,
          } = await tokenGovernance.contract.methods
            .proposals(proposalHash)
            .call();
          const data = await this.loadFromIPFS(proposalHash);
          return new Proposal({
            ...data,
            creator: initiator,
            hash: proposalHash,
            openAt: new Date(openTime * 1000),
            finalized,
            yesVotes,
            noVotes,
          });
        })
      )
    );
    this.loading = false;
    console.log([...this.proposals]);
  }

  private async loadFromIPFS(
    proposalHash: string
  ): Promise<IStoredProposalData> {
    const ipfsHash = hexToCid(proposalHash);
    console.log('Retrieving from IPFS', { proposalHash, ipfsHash });
    const rawData = await IPFS.get(ipfsHash);
    console.log('Retrieved', { rawData });
    return JSON.parse(rawData.toString());
  }
}

export const proposalStore = new ProposalStore();
