import { TransactionReceipt } from 'web3/types';
import PromiEvent from 'web3/promiEvent';

export const txSuccess = (tx: PromiEvent<TransactionReceipt>) =>
  tx.then((receipt: TransactionReceipt) => {
    if (!receipt.status) throw new Error('Tx failed');
    return receipt;
  });
