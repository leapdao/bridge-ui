/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Fragment } from 'react';
import { observer } from 'mobx-react';
import { Route, match } from 'react-router';
import { Link } from 'react-router-dom';
import { observable } from 'mobx';

import { Form, Input, Button, Divider, Alert } from 'antd';

import AppLayout from '../../components/appLayout';
import HexString from '../../components/hexString';

import Block from './block';
import Transaction from './transaction';
import Address from './address';
import { tokensStore } from '../../stores/tokens';
import { explorerStore } from '../../stores/explorer';
import { web3RootStore } from '../../stores/web3/root';
import { bridgeStore } from '../../stores/bridge';
import { operatorStore } from '../../stores/operator';
import { exitHandlerStore } from '../../stores/exitHandler';

interface ExplorerProps {
  match: match<any>;
  history: any;
}

@observer
export default class Explorer extends React.Component<ExplorerProps, any> {
  @observable
  private value = '';

  private get leap() {
    return tokensStore.tokenForColor(0);
  }

  public render() {
    const { match: routerMatch } = this.props;

    return (
      <AppLayout section="explorer">
        <h1>Block Explorer</h1>
        <Form layout="inline" className="explorer-search">
          <Form.Item className="explorer-search__input">
            <Input
              addonBefore="Search"
              value={this.value}
              onChange={e => {
                this.value = e.target.value;
              }}
            />
          </Form.Item>
          <Form.Item className="explorer-search__button">
            <Button
              type="primary"
              loading={explorerStore.searching}
              onClick={() => {
                explorerStore.search(this.value, this.props.history).then(
                  () => {
                    this.value = '';
                  },
                  () => null
                );
              }}
            >
              Go!
            </Button>
          </Form.Item>
          {!explorerStore.success && !explorerStore.searching && (
            <Alert
              type="error"
              message="No results found for your search."
              closable
              onClose={() => {
                explorerStore.success = true;
              }}
            />
          )}
        </Form>

        <Divider />

        <Route path={`${routerMatch.path}/`} exact component={Block} />
        <Route
          path={`${routerMatch.path}/block/:hashOrNumber`}
          component={Block}
        />
        <Route path={`${routerMatch.path}/tx/:hash`} component={Transaction} />
        <Route path={`${routerMatch.path}/address/:addr`} component={Address} />

        <h1>Chain info</h1>
        <dl className="info">
          <dt>Network</dt>
          <dd>{web3RootStore.name}</dd>
          <dt>Bridge contract</dt>
          <dd>
            <HexString>{bridgeStore.address}</HexString>
          </dd>
          <dt>Operator contract</dt>
          <dd>
            <HexString>{operatorStore.address}</HexString>
          </dd>
          <dt>Exit contract</dt>
          <dd>
            <HexString>{exitHandlerStore.address}</HexString>
          </dd>
          {this.leap && (
            <Fragment>
              <dt>Token contract address</dt>
              <dd>
                <Link to={`/explorer/address/${this.leap.address}`}>
                  <HexString>{this.leap.address}</HexString>
                </Link>
              </dd>
            </Fragment>
          )}
        </dl>
      </AppLayout>
    );
  }
}
