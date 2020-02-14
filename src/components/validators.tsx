/**
 * Copyright (c) 2020-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { List } from 'antd';
import { observer } from 'mobx-react';
import { operatorStore } from '../stores/operator';
import SlotHeartbeatsChart from './heartbeats/slotHeartbeatsChart';

interface ValidatorsProps {}

interface ValidatorsState {}

@observer
export default class Validators extends React.Component<
  ValidatorsProps,
  ValidatorsState
> {
  constructor(props: ValidatorsProps) {
    super(props);
  }

  public render() {
    return (
      <List
        dataSource={operatorStore.slots}
        renderItem={slot => (
          <List.Item key={'slot' + slot.id}>
            <SlotHeartbeatsChart slot={slot} periodsToShow={15} />
          </List.Item>
        )}
      />
    );
  }
}
