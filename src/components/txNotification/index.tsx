/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import 'antd/dist/antd.css';

import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { notification } from 'antd';
import { TxStatus } from './types';

const statusDetails = {
  [TxStatus.CREATED]: { text: 'Waiting for signature..', icon: 'warning' },
  [TxStatus.INFLIGHT]: { text: 'Mining..', icon: 'info' },
  [TxStatus.SUCCEED]: { text: 'Success', icon: 'success' },
  [TxStatus.FAILED]: { text: 'Transaction failed', icon: 'error' },
  [TxStatus.CANCELLED]: { text: 'Cancelled', icon: 'error' },
};

const TxNotification = ({ transactions }) => {
  transactions.map.observe((txChange) => {
    if (txChange.type === 'delete') {
      notification.close(txChange.name);
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
      duration: 0,
      description: description,
    };

    notification[statusDetails[status].icon](msg);
  });
  return null;
};

TxNotification.propTypes = {
  transactions: PropTypes.object,
};

export default inject('transactions')(observer(TxNotification));
