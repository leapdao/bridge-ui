import { computed, observable } from 'mobx';
import Web3 from 'web3';
import { Contract } from 'web3/types';
import getWeb3 from '../utils/getWeb3';

export default class ContractStore {
  @observable public address: string;
  public abi: any[];
  public iWeb3?: Web3;

  constructor(abi: any[], address: string) {
    this.abi = abi;
    this.address = address;
  }

  @computed
  public get contract(): Contract {
    const web3 = getWeb3() as Web3;
    return new web3.eth.Contract(this.abi, this.address);
  }

  @computed
  public get iContract(): Contract | undefined {
    if ((window as any).web3) {
      this.iWeb3 = getWeb3(true) as Web3;
      return new this.iWeb3.eth.Contract(this.abi, this.address);
    }
  }
}
