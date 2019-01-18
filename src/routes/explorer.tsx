/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Route, match } from 'react-router';
import { Link } from 'react-router-dom';
import { observable } from 'mobx';

import { Form, Input, Button, Divider, Alert } from 'antd';

import AppLayout from '../components/appLayout';
import ExplorerStore from '../stores/explorer';
import Network from '../stores/network';
import Tokens from '../stores/tokens';

import Block from './block';
import Transaction from './transaction';
import Address from './address';
import Operator from '../stores/operator';
import ExitHandler from '../stores/exitHandler';
import Bridge from '../stores/bridge';

interface ExplorerProps {
  explorer: ExplorerStore;
  bridge: Bridge;
  operator: Operator;
  exitHandler: ExitHandler;
  network: Network;
  tokens: Tokens;
  match: match<any>;
  history: any;
}

@inject('tokens', 'network', 'explorer', 'exitHandler', 'bridge', 'operator')
@observer
export default class Explorer extends React.Component<ExplorerProps, any> {
  @observable
  private value = '';

  private get psc() {
    return this.props.tokens.list && this.props.tokens.list[0];
  }

  public render() {
    const { explorer, network, match, operator, exitHandler, bridge } = this.props;

    return (
      <AppLayout section="explorer">
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
          {!explorer.success && !explorer.searching && (
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
          <dd>{network.name}</dd>
          <dt>Bridge contract</dt>
          <dd>{bridge.address}</dd>
          <dt>Operator contract</dt>
          <dd>{operator.address}</dd>
          <dt>Exit contract</dt>
          <dd>{exitHandler.address}</dd>
          {this.psc && (
            <Fragment>
              <dt>Token contract address</dt>
              <dd>
                <Link to={`/explorer/address/${this.psc.address}`}>
                  {this.psc.address}
                </Link>
              </dd>
            </Fragment>
          )}
        </dl>
      </AppLayout>
    );
  }
}
