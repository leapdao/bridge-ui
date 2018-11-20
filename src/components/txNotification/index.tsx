/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Spin, Icon, notification } from 'antd';

import { TxStatus } from './types';

/*
 * Because of bad typings in antd
 */
const antd = {
  Icon: Icon as any,
  Spin: Spin as any,
  notification: notification as any,
};

const statusDetails = {
  [TxStatus.CREATED]: {
    text: 'Waiting for signature..',
    icon: <antd.Icon type="key" />,
  },
  [TxStatus.INFLIGHT]: { text: 'Mining..', icon: <antd.Spin /> },
  [TxStatus.SUCCEED]: {
    text: 'Success',
    icon: <antd.Icon type="check-circle" style={{ color: 'green' }} />,
  },
  [TxStatus.FAILED]: {
    text: 'Transaction failed',
    icon: <antd.Icon type="close-circle" style={{ color: 'red' }} />,
  },
  [TxStatus.CANCELLED]: {
    text: 'Cancelled',
    icon: <antd.Icon type="close-circle-o" style={{ color: 'red' }} />,
  },
};

const TxNotification: React.SFC<{
  transactions: any;
}> = ({ transactions }) => {
  transactions.map.observe(txChange => {
    if (txChange.type === 'delete') {
      antd.notification.close(txChange.name);
      return;
    }

    const status = txChange.newValue.status;

    const description = (
      <div>
        <p>{txChange.newValue.description || ''}</p>
        <p>{statusDetails[status].text}</p>
      </div>
    );

    const msg = {
      key: txChange.name,
      message: txChange.newValue.message || '',
      icon: statusDetails[status].icon,
      duration: 0,
      description: description,
    };

    antd.notification.open(msg);
  });
  return null;
};

TxNotification.propTypes = {
  transactions: PropTypes.object,
};

export default inject('transactions')(observer(TxNotification));
