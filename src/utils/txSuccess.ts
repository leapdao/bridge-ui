import { TransactionReceipt } from "web3/types";

export const txSuccess = (tx: TransactionReceipt) => new Promise((resolve, reject) => {
  tx.once('receipt', (receipt) => {
    if (!receipt.status) reject();
    resolve(receipt);   
  });
});
