import { TransactionReceipt } from 'web3/types';
import PromiEvent from 'web3/promiEvent';

export enum TxStatus {
  CREATED,
  INFLIGHT,
  SUCCEED,
  FAILED,
  CANCELLED,
}

export declare interface DetailedInflightTxReceipt {
  key: string;
  futureReceipt: PromiEvent<TransactionReceipt>;
  message?: string;
  description?: string;
  status?: TxStatus;
}
