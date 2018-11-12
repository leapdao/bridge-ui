/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { observer, inject } from 'mobx-react';
import AppLayout from '../components/appLayout';
import Monitor from '../components/monitor';

@inject(stores => ({
  account: stores.account,
}))
@observer
export default class Status extends React.Component {
  render() {
    return (
      <AppLayout section="status">
        <h1>Nodes status</h1>
        <Monitor
          nodes={[
            {
              url: 'https://testnet-1.leapdao.org',
              label: 'Testnet #1',
            },
            {
              url: 'https://testnet-2.leapdao.org',
              label: 'Testnet #2',
            },
          ]}
        />
      </AppLayout>
    );
  }
}

Status.propTypes = {};
