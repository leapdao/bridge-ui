import { observable } from 'mobx';

export interface IStoredProposalData {
  title: string;
  description: string;
}

interface IProposal extends IStoredProposalData {
  creator?: string;
  hash?: string;
}

export class Proposal {
  @observable
  private _title: string = '';

  @observable
  private _description: string = '';

  @observable
  private _creator: string;

  @observable
  private ipfsHash: string = null;

  constructor({ title, description, creator, hash }: IProposal) {
    this._title = title;
    this._creator = creator;
    this._description = description;
    this.ipfsHash = hash;
  }

  @computed get title() {
    return this._title;
  }

  @computed get description() {
    return this._description;
  }

  @computed get creator() {
    return this._creator;
  }

  @computed get hash() {
    return this.ipfsHash;
  }

  public toString() {
    return JSON.stringify({
      title: this.title,
      description: this.description,
      creator: this.creator,
      hash: this.ipfsHash,
    });
  }
}
