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
import { Route } from 'react-router';
import { Spin } from 'antd';

import Slots from '../routes/slots';
import Deposit from '../routes/deposit';
import Faucet from '../routes/faucet';
import RegisterToken from '../routes/registerToken';
import Info from '../routes/info';
import Explorer from '../routes/explorer';

import AppLayout from './appLayout';
import Message from './message';

import '../style.css';

@inject(stores => ({
  account: stores.account,
  bridge: stores.bridge,
  explorer: stores.explorer,
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
    const { account, match } = this.props;

    if (!account.ready) {
      return (
        <Message hideBg>
          <Spin size="large" />
        </Message>
      );
    }
    return (
      <AppLayout>
        <Route path={`${match.path}/`} exact component={Slots} />
        <Route path={`${match.path}/deposit`} exact component={Deposit} />
        <Route
          path={`${match.path}/registerToken`}
          exact
          component={RegisterToken}
        />
        <Route path={`${match.path}/faucet`} exact component={Faucet} />
        <Route path={`${match.path}/info`} exact component={Info} />
        <Route path={`${match.path}/explorer`} exact component={Explorer} />
        <Route
              path={`${match.path}/explorer/:search`}
              render={props => <Explorer {...this.props} {...props} />}
        />
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
