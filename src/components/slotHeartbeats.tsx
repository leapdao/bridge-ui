/**
 * Copyright (c) 2020-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { reaction, observable } from 'mobx';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { bufferToHex } from 'ethereumjs-util';

import { range } from '../utils/';
import { Slot } from '../stores/slot';
import PeriodHeartbeatBadge from './periodHeartbeatBadge';

import { Tx, LeapTransaction } from 'leap-core';

import { web3PlasmaStore } from '../stores/web3/plasma';

interface SlotHeartbeatsProps {
  slot: Slot;
  heartbeatColor: number;
  periodsToShow: number;
}

interface SlotHeartbeatsState {
  exitQueueSize: number;
}

@observer
export default class SlotHeartbeats extends React.Component<
  SlotHeartbeatsProps,
  SlotHeartbeatsState
> {
  @observable
  private lastPeriodNumber: number;

  @observable
  private periodsWithHeartbeat: number[];

  constructor(props: SlotHeartbeatsProps) {
    super(props);

    reaction(() => this.props.slot, this.load);
    this.load();
  }

  private async getHeartbeatedPeriods(
    txs: Set<number>,
    hash: Buffer,
    limit: number
  ): Promise<Set<number>> {
    const txData = (await web3PlasmaStore.instance.eth.getTransaction(
      bufferToHex(hash)
    )) as LeapTransaction;
    if (txData.from !== txData.to) {
      return txs;
    }
    const periodNumber = Math.floor(txData.blockNumber / 32) + 1;
    txs.add(periodNumber);
    if (limit && txs.size > limit) {
      return txs;
    }

    const tx = Tx.fromRaw(txData.raw);
    if (!tx.inputs.length) {
      return txs;
    }
    return this.getHeartbeatedPeriods(txs, tx.inputs[0].prevout.hash, limit);
  }

  private async lastPeriodsWithHeartbeat(
    slot,
    heartbeatColor,
    numberOfPeriods
  ) {
    const [unspent] = await web3PlasmaStore.instance.getUnspent(
      slot.owner,
      heartbeatColor
    );

    if (!unspent) {
      return [];
    }

    return this.getHeartbeatedPeriods(
      new Set(),
      unspent.outpoint.hash,
      numberOfPeriods
    );
  }

  @autobind
  private async load() {
    const { slot, heartbeatColor, periodsToShow } = this.props;
    const latestPlasmaHeight = await web3PlasmaStore.instance.eth.getBlockNumber();
    this.periodsWithHeartbeat = [
      ...(await this.lastPeriodsWithHeartbeat(
        slot,
        heartbeatColor,
        periodsToShow
      )),
    ];
    this.lastPeriodNumber = Math.floor(latestPlasmaHeight / 32);
  }

  public render() {
    const { slot, periodsToShow } = this.props;

    const toPeriod = this.lastPeriodNumber || periodsToShow;
    const fromPeriod = toPeriod >= periodsToShow ? toPeriod - periodsToShow : 1;

    console.log({ fromPeriod, toPeriod });

    const hasHeartbeat = period => {
      if (!this.periodsWithHeartbeat) {
        return null;
      }
      return this.periodsWithHeartbeat.indexOf(period) >= 0;
    };

    return (
      <div>
        {slot.owner && <h3>{slot.owner}</h3>}
        {!slot.owner && (
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.08)',
              width: 420,
              height: 25,
            }}
          />
        )}
        {range(fromPeriod, toPeriod).map(period => (
          <PeriodHeartbeatBadge
            hasHeartbeat={hasHeartbeat(period)}
            periodNumber={period}
          />
        ))}
      </div>
    );
  }
}
