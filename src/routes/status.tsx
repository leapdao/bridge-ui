/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import AppLayout from '../components/appLayout';
import { default as Monitor } from '../components/monitor';
import { CONFIG } from '../config';
import Validators from '../components/validators';
import Watchtower from '../components/watchtower';

export default class Status extends React.Component<{}, {}> {
  public render() {
    return (
      <AppLayout section="status">
        <h1>Nodes status</h1>
        <Monitor nodes={CONFIG.nodes} />
        <h1>Validator status</h1>
        <Validators />
        <h1>Network status</h1>
        <Watchtower />
      </AppLayout>
    );
  }
}
