import { tokenGovernance } from '../contracts/tokenGovernance';
import * as IPFS from '../ipfs';
import { Proposal } from './proposal';
import { EventEmitter } from 'events';
import { web3InjectedStore } from '../web3/injected';

const { hexToCid, cidToHex } = IPFS;

export enum ProposalLifecycle {
  IPFS_UPLOAD = 'proposal:ipfsUpload',
  SUBMIT_TO_CONTRACT = 'proposal:submitToContract',
  CREATED = 'proposal:created',
  FAILED_TO_CREATE = 'proposal:failedToCreate',
}

export class ProposalStore {
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

  private async submitToContract(proposal: Proposal, progress: EventEmitter) {
    progress.emit(ProposalLifecycle.SUBMIT_TO_CONTRACT, proposal);
    const [from] = await web3InjectedStore.instance.eth.getAccounts();
    const tx = tokenGovernance.iContract.methods
      .registerProposal(proposal.hash)
      .send({ from });

    tokenGovernance.watchTx(tx, 'registerProposal', {
      message:
        'Registering token governance proposal. ' +
        'A stake of 5000 LEAP will be deducted from your account',
    });

    tx.then(_ => {
      progress.emit(ProposalLifecycle.CREATED, proposal);
    });

    return tx;
  }

  public async create(
    title: string,
    description: string,
    progress: EventEmitter = new EventEmitter()
  ): Promise<Proposal> {
    const proposalHash = await this.storeToIPFS(title, description, progress);
    const proposal = new Proposal(title, description, proposalHash);
    await this.submitToContract(proposal, progress).catch(e => {
      console.error(e);
      progress.emit(ProposalLifecycle.FAILED_TO_CREATE, { title });
    });

    return proposal;
  }

  public async load(proposalHash: string): Promise<Proposal> {
    const ipfsHash = hexToCid(proposalHash);
    console.log('Retrieving from IPFS', { proposalHash, ipfsHash });
    const rawData = await IPFS.get(ipfsHash);
    console.log('Retrieved', { rawData });
    const proposal = JSON.parse(rawData.toString());
    return new Proposal(proposal.title, proposal.description, proposalHash);
  }
}

export const proposalStore = new ProposalStore();
