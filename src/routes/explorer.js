/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { observable } from 'mobx';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { Alert, Form, Input, Button, Divider } from 'antd';

import AppLayout from '../components/appLayout';
import Active from '../components/explorer/active';
import { NETWORKS } from '../utils';
import getParsecWeb3 from '../utils/getParsecWeb3';

@inject(({ tokens, network, explorer, bridge }) => ({
  psc: tokens.list && tokens.list[0],
  network,
  explorer,
  bridge,
}))
@observer
export default class Explorer extends React.Component {
  constructor(props) {
    super(props);

    const { search } = props.match.params;
    if (props.explorer) {
      props.explorer.search(search);
    }

    getParsecWeb3()
      .getConfig()
      .then(config => {
        if (
          this.props.bridge &&
          this.props.bridge.address !== config.bridgeAddr
        ) {
          this.props.bridge.address = config.bridgeAddr;
        }
      });
  }

  componentWillReceiveProps(nextProps) {
    const { search } = this.props.match.params;
    const { search: nextSearch } = nextProps.match.params;
    if (search !== nextSearch) {
      this.props.explorer.search(nextSearch);
    }
  }

  @observable
  value;

  render() {
    const { explorer, bridge, network, psc } = this.props;

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
            <Button type="primary" loading={explorer.searching}>
              <Link to={`/explorer/${this.value}`}>Go!</Link>
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        {!explorer.success &&
          !explorer.searching && (
            <Alert type="error" message="No results found for your search." />
          )}

        <Active />

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
  network: PropTypes.object,
  psc: PropTypes.object,
  bridge: PropTypes.object,
};
