import { TransactionReceipt, PromiEvent } from 'web3-core';

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
