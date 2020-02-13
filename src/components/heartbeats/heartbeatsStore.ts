import { bufferToHex } from 'ethereumjs-util';
import { observable, reaction, autorun, toJS } from 'mobx';
import autobind from 'autobind-decorator';
import { web3PlasmaStore } from '../../stores/web3/plasma';
import { operatorStore } from '../../stores/operator';
import storage from '../../utils/storage';
import { range } from '../../utils/range';

import { Tx, LeapTransaction } from 'leap-core';
import { explorerStore } from '../../stores/explorer';

type SlotHeartbeatsData = {
  periods: Set<number>;
  lastPeriodChecked: number;
  lastUtxo?: Buffer;
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

    return operatorStore.slots.map((s, i) => {
      if (storedData[i] && storedData[i].owner === s.owner) {
        return { ...storedData[i], periods: new Set(storedData[i].periods) };
      }
      return {
        periods: new Set(),
        lastPeriodChecked: 0,
        owner: operatorStore.slots[i].owner,
      };
    });
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

  private async loadHeartbeatsForSlot(slotId, latestHeartbeatUtxo) {
    if (!latestHeartbeatUtxo) {
      return;
    }

    const slotData = this.heartbeats[slotId];
    const latestPlasmaHeight = await web3PlasmaStore.instance.eth.getBlockNumber();

    const periodForTx = Math.floor(latestHeartbeatUtxo.blockNumber / 32) + 1;
    slotData.periods.add(periodForTx);

    await this.loadHeartbeatPeriodsRecursive(
      slotData,
      latestHeartbeatUtxo.inputs[0].prevout.hash
    );
    slotData.lastPeriodChecked = Math.floor(latestPlasmaHeight / 32) + 1;
  }

  private async scanForLatestHeartbeatUTXOs(utxoPerSlot, blockHeight) {
    // stop when nothing to scan or we collected data for all the slots
    const foundUtxosForAllSlots = !Object.values(utxoPerSlot).filter(u => !u)
      .length;
    if (blockHeight === 0 || foundUtxosForAllSlots) {
      return utxoPerSlot;
    }

    // go through block's txs and find ones of heartbeat color
    const block = await explorerStore.getBlock(blockHeight);
    const slotOwners = Object.keys(utxoPerSlot);
    utxoPerSlot = block.transactions.reduce((s, tx: LeapTransaction) => {
      if (tx.color !== Number(this.heartbeatColor)) {
        return s;
      }
      const txOwner = tx.to.toLowerCase();

      // skip non-active validators
      if (slotOwners.indexOf(txOwner) < 0) {
        return s;
      }

      s[txOwner] = Tx.fromRaw(tx.raw);
      return s;
    }, utxoPerSlot);

    return this.scanForLatestHeartbeatUTXOs(utxoPerSlot, blockHeight - 1);
  }

  @autobind
  private async loadHeartbeats() {
    const latestPlasmaHeight = await web3PlasmaStore.instance.eth.getBlockNumber();
    const latestUtxos = await this.scanForLatestHeartbeatUTXOs(
      this.heartbeats
        .filter(h => h.owner !== '0x0000000000000000000000000000000000000000')
        .reduce((s, e) => {
          s[e.owner.toLowerCase()] = null;
          return s;
        }, {}),
      latestPlasmaHeight
    );

    this.heartbeats.forEach((slotData, slotId) => {
      this.loadHeartbeatsForSlot(
        slotId,
        latestUtxos[slotData.owner.toLowerCase()]
      );
    });
  }
}

export const heartbeatsStore = new HeartbeatsStore();
