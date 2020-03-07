import { observable } from 'mobx';

export interface IStoredProposalData {
  title: string;
  description: string;
}

interface IProposal extends IStoredProposalData {
  creator?: string;
  hash?: string;
  finalized?: boolean;
  yesVotes?: number;
  noVotes?: number;
  openAt?: Date;
}

export class Proposal {
  @observable public readonly description: string;
  @observable public readonly finalized: boolean;
  @observable public readonly yesVotes: number;
  @observable public readonly noVotes: number;
  @observable public readonly creator: string;
  @observable public readonly openAt: Date;
  @observable public readonly title: string;
  @observable public readonly hash: string;

  constructor(proposalObject: IProposal) {
    Object.assign(this, proposalObject);
  }
}
