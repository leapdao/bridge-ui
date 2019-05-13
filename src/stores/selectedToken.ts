import { observable, computed, autorun } from 'mobx';
import autobind from 'autobind-decorator';
import { tokensStore } from './tokens';

const LS_KEY = 'wallet_color';

export class SelectedTokenStore {
  @observable
  public color = 0;

  constructor() {
    this.color = Number(localStorage.getItem(LS_KEY) || 0);
    autorun(this.save);
  }

  @computed
  public get token() {
    return tokensStore.tokenForColor(this.color);
  }

  @autobind
  protected save() {
    localStorage.setItem(LS_KEY, String(this.color));
  }
}

export const selectedTokenStore = new SelectedTokenStore();
