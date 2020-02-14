/**
 * Copyright (c) 2020-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react';

import { range } from '../../utils/';
import { Slot } from '../../stores/slot';
import HeartbeatBadge from './heartbeatBadge';

import { heartbeatsStore } from './heartbeatsStore';
import { nodeStore } from '../../stores/node';

interface SlotHeartbeatsChartProps {
  slot: Slot;
  periodsToShow: number;
}

interface SlotHeartbeatsChartState {}

@observer
export default class SlotHeartbeatsChart extends React.Component<
  SlotHeartbeatsChartProps,
  SlotHeartbeatsChartState
> {
  constructor(props: SlotHeartbeatsChartProps) {
    super(props);
  }

  @computed
  get lastPeriodNumber(): number {
    return Math.floor(nodeStore.latestBlock / 32) + 1;
  }

  private hasHeartbeat(slotId, period): boolean {
    const slotHeartbeats = heartbeatsStore.heartbeats[slotId];
    const lastPeriodSeen = Math.min(...slotHeartbeats.periods);
    if (period < lastPeriodSeen) {
      return null;
    }
    return slotHeartbeats.periods.has(period);
  }

  public render() {
    const { slot, periodsToShow } = this.props;

    if (!heartbeatsStore.heartbeats) {
      return <div />;
    }

    const toPeriod = this.lastPeriodNumber || periodsToShow;
    const fromPeriod = toPeriod >= periodsToShow ? toPeriod - periodsToShow : 1;

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
          <HeartbeatBadge
            hasHeartbeat={this.hasHeartbeat(slot.id, period)}
            periodNumber={period}
            key={slot.id + period}
          />
        ))}
      </div>
    );
  }
}
