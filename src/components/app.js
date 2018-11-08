/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

// import 'antd/dist/antd.css';

import React from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { Route } from 'react-router';
import { Spin } from 'antd';

import Slots from '../routes/slots';
import Wallet from '../routes/wallet';
import RegisterToken from '../routes/registerToken';

import AppLayout from './appLayout';
import Message from './message';

import '../style.css';

@inject(stores => ({
  account: stores.account,
  bridge: stores.bridge,
}))
@observer
class App extends React.Component {
  constructor(props) {
    super(props);
    props.bridge.address = props.match.params.bridgeAddr;
  }

  componentWillReceiveProps(nextProps) {
    nextProps.bridge.address = nextProps.match.params.bridgeAddr;
  }

  render() {
    const {
      account,
      match: { path },
    } = this.props;

    if (!account.ready) {
      return (
        <Message hideBg>
          <Spin size="large" />
        </Message>
      );
    }
    return (
      <AppLayout>
        <Route path={`${path}/`} exact component={Slots} />
        <Route path={`${path}/wallet`} exact component={Wallet} />
        <Route path={`${path}/registerToken`} exact component={RegisterToken} />
      </AppLayout>
    );
  }
}

App.propTypes = {
  // settings stores as optional to get rid of 'undefined' warnings
  // > Make sure to mark userStore as an optional property.
  // > It should not (necessarily) be passed in by parent components at all!
  // https://github.com/mobxjs/mobx-react#with-typescript
  account: PropTypes.object,
  bridge: PropTypes.object,
  match: PropTypes.object,
};

export default App;
