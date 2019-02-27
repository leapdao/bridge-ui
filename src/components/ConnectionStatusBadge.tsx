/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observer } from 'mobx-react';
import { Badge } from 'antd';
import ConnectionStatus from '../stores/web3/connectionStatus';

interface ConnectionStatusProps {
  connectionStatus: ConnectionStatus;
}

const STATUSES = {
  [ConnectionStatus.CONNECTING]: { status: 'processing', text: 'connecting' },
  [ConnectionStatus.CONNECTED]: { status: 'success', text: 'connected' },
  [ConnectionStatus.DISCONNECTED]: { status: 'error', text: 'disconnected' },
};

@observer
export default class ConnectionStatusBadge extends React.Component<ConnectionStatusProps> {

  constructor(props) {
    super(props);
  }

  render() {
    const { connectionStatus } = this.props;

    const { status, text } = STATUSES[connectionStatus];

    return (
      <Badge status={status as any} text={text} style={{ float: "right" }}/>
    );    
  }
};