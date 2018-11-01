/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Route } from 'react-router';
import { observable } from 'mobx';
import PropTypes from 'prop-types';

import { Form, Input, Button, Divider, Alert } from 'antd';

import AppLayout from '../components/appLayout';
import { NETWORKS } from '../utils';

import Block from './block';
import Transaction from './transaction';
import Address from './address';

@inject(({ tokens, network, explorer, bridge, web3 }) => ({
  psc: tokens.list && tokens.list[0],
  network,
  explorer,
  bridge,
  web3,
}))
@observer
export default class Explorer extends React.Component {
  constructor(props) {
    super(props);

    props.web3.plasma.getConfig().then(config => {
      if (
        this.props.bridge &&
        this.props.bridge.address !== config.bridgeAddr
      ) {
        this.props.bridge.address = config.bridgeAddr;
      }
    });
  }

  @observable
  value = '';

  render() {
    const { explorer, bridge, network, psc, match } = this.props;

    return (
      <AppLayout>
        <h1>Block Explorer</h1>
        <Form layout="inline">
          <Form.Item>
            <Input
              addonBefore="Search"
              value={this.value}
              style={{ width: 700 }}
              onChange={e => {
                this.value = e.target.value;
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              loading={explorer.searching}
              onClick={() => {
                explorer.search(this.value, this.props.history).then(
                  () => {
                    this.value = '';
                  },
                  () => {}
                );
              }}
            >
              Go!
            </Button>
          </Form.Item>
          {!explorer.success &&
            !explorer.searching && (
              <Alert
                type="error"
                message="No results found for your search."
                closable
                onClose={() => {
                  explorer.success = true;
                }}
              />
            )}
        </Form>

        <Divider />

        <Route path={`${match.path}/`} exact component={Block} />
        <Route path={`${match.path}/block/:hashOrNumber`} component={Block} />
        <Route path={`${match.path}/tx/:hash`} component={Transaction} />
        <Route path={`${match.path}/address/:addr`} component={Address} />

        <h1>Chain info</h1>
        <dl className="info">
          <dt>Network</dt>
          <dd>{NETWORKS[network.network].name || network.network}</dd>
          <dt>Bridge contract address</dt>
          <dd>{bridge.address}</dd>
          {psc && (
            <Fragment>
              <dt>Token contract address</dt>
              <dd>{psc.address}</dd>
            </Fragment>
          )}
        </dl>
      </AppLayout>
    );
  }
}

Explorer.propTypes = {
  explorer: PropTypes.object,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  network: PropTypes.object,
  psc: PropTypes.object,
  bridge: PropTypes.object,
  web3: PropTypes.object,
};
