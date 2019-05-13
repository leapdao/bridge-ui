import { observable, action } from 'mobx';
import Web3 from './ts_workaround.js';

export class Web3InjectedStore {
  @observable.ref
  public instance: Web3 | null = null;

  @observable
  public available = false;

  @observable
  public approved = false;

  @observable
  public ready = false;

  constructor() {
    const { ethereum, web3 } = window as any;
    const metamask = ethereum && ethereum._metamask; // eslint-disable-line no-underscore-dangle

    this.available = !!(ethereum || web3);
    if (metamask) {
      setTimeout(() => {
        if (metamask.isEnabled()) {
          this.updateInstance(ethereum);
        } else {
          metamask.isApproved().then(approved => {
            this.updateInstance(approved ? ethereum : null, approved);
          });
        }
      }, 500);
    } else if (web3) {
      this.updateInstance(web3.currentProvider);
    } else {
      this.updateInstance(null, false);
      if (ethereum) {
        this.enable();
      }
    }
  }

  @action
  private updateInstance(provider, approved = true) {
    this.ready = true;
    this.approved = approved;
    if (provider) {
      this.instance = new Web3(provider);
    }
  }

  public enable() {
    const { ethereum } = window as any;
    const metamask = ethereum._metamask || ethereum; // eslint-disable-line no-underscore-dangle

    if (!metamask) {
      throw new Error('Only for EIP-1102 compilant metamask');
    }

    ethereum
      .enable()
      .then(() => {
        this.instance = new Web3(ethereum);
        this.approved = true;
      })
      .catch(err => {
        console.error(err);
      });
  }
}

export const web3InjectedStore = new Web3InjectedStore();
