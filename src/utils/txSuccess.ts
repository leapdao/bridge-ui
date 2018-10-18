import { PromiEvent, TransactionReceipt } from 'web3/types';

export const txSuccess = (tx: PromiEvent<TransactionReceipt>) =>
  tx.then((receipt: TransactionReceipt) => {
    if (!receipt.status) throw new Error('Tx failed');
    return receipt;
  });
