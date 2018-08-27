import { PromiEvent, TransactionReceipt } from "web3/types";

export declare interface InflightTxPromise {
  tx: PromiEvent<TransactionReceipt>
}
