import { observable } from 'mobx';

export class Proposal {
  @observable public readonly description: string;
  @observable public readonly title: string;
  @observable public readonly hash: string;

  constructor(title: string, description: string, hash?: string) {
    this.description = description;
    this.title = title;
    this.hash = hash;
  }

  public toString() {
    return JSON.stringify({
      title: this.title,
      description: this.description,
      hash: this.hash,
    });
  }
}
