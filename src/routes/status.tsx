/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observer } from 'mobx-react';
import AppLayout from '../components/appLayout';
import { NamedNodeEntry, default as Monitor } from '../components/monitor';
import { PLASMA_NODES } from '../utils';

@observer
export default class Status extends React.Component {
  render() {
    const nodes = Object
      .values(PLASMA_NODES)
      .splice(1)
      .map(url => ({ url } as NamedNodeEntry));
    return (
      <AppLayout section="status">
        <h1>Nodes status</h1>
        <Monitor
          nodes={nodes}
        />
      </AppLayout>
    );
  }
}
