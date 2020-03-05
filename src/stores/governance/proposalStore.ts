import * as IPFS from '../ipfs';
import { Proposal } from './proposal';

const { hexToCid, cidToHex } = IPFS;

export class ProposalStore {
  public async store(proposal: Proposal): Promise<string> {
    console.log('Storing proposal:', proposal.toString());
    const ipfsHash = await IPFS.add(proposal.toString());
    const proposalHash = cidToHex(ipfsHash);
    console.log('Stored', { proposalHash, ipfsHash });
    return proposalHash;
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
