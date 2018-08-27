/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */
import 'antd/dist/antd.css';

import React from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { notification } from 'antd';
import { TxStatus } from './types';


const statusDetails = {};
statusDetails[TxStatus.CREATED] = { text: 'Waiting for signature..', icon: 'warning' };
statusDetails[TxStatus.INFLIGHT] = { text: 'Mining..', icon: 'info' };
statusDetails[TxStatus.SUCCEED] = { text: 'Success', icon: 'success' };
statusDetails[TxStatus.FAILED] = { text: 'Transaction failed', icon: 'error' };
statusDetails[TxStatus.CANCELLED] = { text: 'Cancelled', icon: 'error' };

const TxNotification = ({ txs }) => {
  txs.observe((txChange) => {

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
      duration: status === TxStatus.CREATED || status === TxStatus.INFLIGHT ? 0 : 2,
      description: description,
    };

    notification[statusDetails[status].icon](msg);
  });
  return null;
};

TxNotification.propTypes = {
  txs: PropTypes.object,
};

export default inject(stores => ({
  txs: stores.transactions.map,
}))(observer(TxNotification));
