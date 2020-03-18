import { observable } from 'mobx';

const SEVEN_DAYS = 604800000; // 1000 * 60 * 60 * 24 * 7 = 7 days

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

  public isMature(): boolean {
    const timeSinceOpen = Date.now() - this.openAt.getTime();
    return timeSinceOpen > SEVEN_DAYS;
  }
}
