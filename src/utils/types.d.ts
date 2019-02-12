import { TransactionReceipt, PromiEvent } from 'web3-core';

export declare interface InflightTxReceipt {
  futureReceipt: PromiEvent<TransactionReceipt>;
}

export type NamedNodeEntry = {
  url: string;
  label?: string;
};