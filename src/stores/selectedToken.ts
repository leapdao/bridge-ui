import { observable, computed, autorun, when } from 'mobx';
import autobind from 'autobind-decorator';
import { tokensStore } from './tokens';

const LS_KEY = 'wallet_color';

const DEFAULT_COLOR = 0;

export class SelectedTokenStore {
  @observable
  public color = DEFAULT_COLOR;

  constructor() {
    this.color = Number(localStorage.getItem(LS_KEY) || DEFAULT_COLOR);

    autorun(this.save);
    when(
      () => tokensStore.list && tokensStore.list.length > 0,
      () => {
        if (!tokensStore.tokenForColor(this.color)) {
          this.color = DEFAULT_COLOR;
        }
      }
    );
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
