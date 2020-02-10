import { bufferToHex } from 'ethereumjs-util';
import {
  observable,
  when,
  reaction,
  IObservableArray,
  autorun,
  toJS,
} from 'mobx';
import autobind from 'autobind-decorator';
import { web3PlasmaStore } from '../../stores/web3/plasma';
import { operatorStore } from '../../stores/operator';
import { nodeStore } from '../../stores/node';
import storage from '../../utils/storage';
import { range } from '../../utils/range';

import { Tx, LeapTransaction } from 'leap-core';

type SlotHeartbeatsData = {
  periods: Set<number>;
  lastPeriodChecked: number;
  owner: string;
};

export class HeartbeatsStore {
  private storageKey: string;

  @observable
  private heartbeatColor: number;

  public keepPeriodsLimit: number;

  @observable
  public latestBlock: number = 0;

  @observable
  public heartbeats: SlotHeartbeatsData[];

  constructor(keepPeriodsLimit = 15) {
    this.keepPeriodsLimit = keepPeriodsLimit;

    reaction(
      () => operatorStore.slots,
      () => {
        this.storageKey = `hb-${operatorStore.address}`;
        this.heartbeats = this.initHeartbeatsData();
        operatorStore.contract.methods
          .heartbeatColor()
          .call()
          .then(color => {
            this.heartbeatColor = color;
            this.loadHeartbeats();
          });
      }
    );

    autorun(this.storeData);
  }

  private initHeartbeatsData() {
    let storedData = storage.load(this.storageKey);
    storedData = storedData.length ? storedData : [];

    return [
      // add stored slots if any
      ...storedData.map(s => ({ ...s, periods: new Set(s.periods) })),
      // add new slots without heartbeat data if needed
      ...range(storedData.length, operatorStore.slots.length - 1).map(i => ({
        periods: new Set(),
        lastPeriodChecked: 0,
        owner: operatorStore.slots[i].owner,
      })),
    ];
  }

  @autobind
  private storeData() {
    if (!this.heartbeats) {
      return;
    }
    storage.store(this.storageKey, toJS(this.heartbeats));
  }

  private async loadHeartbeatPeriodsRecursive(
    slotHeartbeatsData: SlotHeartbeatsData,
    heartbeatTxHash: Buffer
  ): Promise<Set<number>> {
    const txData = (await web3PlasmaStore.instance.eth.getTransaction(
      bufferToHex(heartbeatTxHash)
    )) as LeapTransaction;

    const notHeartbeatTx = txData.from !== txData.to;
    if (notHeartbeatTx) {
      return;
    }

    const periodForTx = Math.floor(txData.blockNumber / 32) + 1;

    const alreadySeenTheHeartbeat =
      slotHeartbeatsData.periods.has(periodForTx) &&
      slotHeartbeatsData.periods.has(periodForTx - 1);

    if (alreadySeenTheHeartbeat) {
      return;
    }

    slotHeartbeatsData.periods.add(periodForTx);

    const heartbeatTrackingLimitReached =
      this.keepPeriodsLimit &&
      slotHeartbeatsData.periods.size > this.keepPeriodsLimit;

    if (heartbeatTrackingLimitReached) {
      return;
    }

    // recurse to the previous spend of heartbeat token, if any
    const tx = Tx.fromRaw(txData.raw);
    if (!tx.inputs.length) {
      return;
    }
    return this.loadHeartbeatPeriodsRecursive(
      slotHeartbeatsData,
      tx.inputs[0].prevout.hash
    );
  }

  private async loadHeartbeatsForSlot(slotId) {
    const [heartbeatUtxo] = await web3PlasmaStore.instance.getUnspent(
      this.heartbeats[slotId].owner,
      this.heartbeatColor
    );

    if (!heartbeatUtxo) {
      return;
    }

    const latestPlasmaHeight = await web3PlasmaStore.instance.eth.getBlockNumber();

    await this.loadHeartbeatPeriodsRecursive(
      this.heartbeats[slotId],
      heartbeatUtxo.outpoint.hash
    );
    this.heartbeats[slotId].lastPeriodChecked =
      Math.floor(latestPlasmaHeight / 32) + 1;
  }

  @autobind
  private async loadHeartbeats() {
    this.heartbeats.forEach((_, slotId) => {
      this.loadHeartbeatsForSlot(slotId);
    });
  }
}

export const heartbeatsStore = new HeartbeatsStore();
