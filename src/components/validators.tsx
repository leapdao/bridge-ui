/**
 * Copyright (c) 2020-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { List } from 'antd';
import { observer } from 'mobx-react';
import { observable, when } from 'mobx';
import { operatorStore } from '../stores/operator';
import SlotHeartbeats from './slotHeartbeats';

interface ValidatorsProps {}

interface ValidatorsState {}

@observer
export default class Validators extends React.Component<
  ValidatorsProps,
  ValidatorsState
> {
  @observable
  private heartbeatColor: number;

  constructor(props: ValidatorsProps) {
    super(props);

    this.load = this.load.bind(this);
    when(() => !!operatorStore.contract, this.load);
  }

  private load() {
    operatorStore.contract.methods
      .heartbeatColor()
      .call()
      .then(color => {
        this.heartbeatColor = color;
      });
  }

  public render() {
    return (
      <List
        dataSource={operatorStore.slots}
        renderItem={slot => (
          <List.Item key={'slot' + slot.id}>
            <SlotHeartbeats
              slot={slot}
              heartbeatColor={this.heartbeatColor}
              periodsToShow={15}
            />
          </List.Item>
        )}
      />
    );
  }
}
