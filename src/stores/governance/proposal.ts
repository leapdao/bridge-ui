import { computed, observable } from 'mobx';

import { proposalStore } from './proposalStore';

export class Proposal {
  @observable
  private _title: string = '';

  @observable
  private _description: string = '';

  @observable
  private ipfsHash: string = null;

  constructor(title: string, description: string, hash?: string) {
    this._title = title;
    this._description = description;
    this.ipfsHash = hash;
  }

  public async store(): Promise<string> {
    this.ipfsHash = await proposalStore.store(this);
    return this.ipfsHash;
  }

  @computed get title() {
    return this._title;
  }

  @computed get description() {
    return this._description;
  }

  @computed get hash() {
    return this.ipfsHash;
  }

  public toString() {
    return JSON.stringify({
      title: this.title,
      description: this.description,
    });
  }
}
