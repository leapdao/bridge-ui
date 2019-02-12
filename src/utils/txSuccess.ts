import { TransactionReceipt, PromiEvent } from 'web3-core';

export const txSuccess = (tx: PromiEvent<TransactionReceipt>) =>
  tx.then((receipt: TransactionReceipt) => {
    if (!receipt.status) throw new Error('Tx failed');
    return receipt;
  });
