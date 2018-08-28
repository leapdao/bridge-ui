import { PromiEvent, TransactionReceipt } from "web3/types";

export declare interface InflightTxReceipt {
  futureReceipt: PromiEvent<TransactionReceipt>,
}