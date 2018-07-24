import Web3 from 'web3';
import { Contract } from 'web3/types';
import getWeb3 from '../utils/getWeb3';

export default class ContractStore {
  public address: string;
  protected contract: Contract;
  protected iContract?: Contract;

  constructor(abi: any[], address: string) {
    this.address = address;

    const web3 = getWeb3() as Web3;
    this.contract = new web3.eth.Contract(abi, address);

    if ((window as any).web3) {
      const iWeb3 = getWeb3(true) as Web3;
      this.iContract = new iWeb3.eth.Contract(abi, address);
    }
  }
}
