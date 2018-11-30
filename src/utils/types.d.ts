import { TransactionReceipt } from 'web3/types';
import PromiEvent from 'web3/promiEvent';

export declare interface InflightTxReceipt {
  futureReceipt: PromiEvent<TransactionReceipt>;
}
