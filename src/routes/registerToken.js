/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { List, Form, Input, Button, Icon } from 'antd';

import { isValidAddress } from 'ethereumjs-util';
import autobind from 'autobind-decorator';
import Web3SubmitWarning from '../components/web3SubmitWarning';
import AppLayout from '../components/appLayout';

const Item = observer(({ item }) => (
  <List.Item key={item.address}>
    <List.Item.Meta
      title={
        <Fragment>
          {item.name} ({item.symbol})
          {item.isNft && (
            <Icon
              type="trophy"
              style={{ color: 'lightgray', marginLeft: '5px' }}
              title="Non-fungible token"
            />
          )}
        </Fragment>
      }
      description={
        <Link to={`/explorer/address/${item.address}`}>{item.address}</Link>
      }
    />
  </List.Item>
));

@inject(stores => ({
  tokens: stores.tokens,
  bridge: stores.bridge,
  network: stores.network,
}))
@observer
export default class RegisterToken extends React.Component {
  @observable
  tokenAddr = '';

  @autobind
  handleSubmit(e) {
    e.preventDefault();
    const { bridge } = this.props;

    bridge
      .registerToken(this.tokenAddr)
      .on('transactionHash', registerTxHash => {
        console.log('registerToken', registerTxHash); // eslint-disable-line
        this.tokenAddr = '';
      });
  }

  @autobind
  handleChange(e) {
    this.tokenAddr = e.target.value;
  }

  render() {
    const { network, tokens, match } = this.props;

    return (
      <AppLayout section="registerToken" bridgeAddr={match.params.bridgeAddr}>
        <h1>Register a new ERC20/ERC721 token</h1>

        <Web3SubmitWarning />

        <Form onSubmit={this.handleSubmit} layout="inline">
          <Form.Item>
            <Input
              value={this.tokenAddr}
              onChange={this.handleChange}
              style={{ width: 300 }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              disabled={
                !network.canSubmit ||
                !this.tokenAddr ||
                !isValidAddress(this.tokenAddr)
              }
            >
              Register token
            </Button>
          </Form.Item>
        </Form>

        <h2 style={{ marginBottom: 16, marginTop: 32 }}>Registered tokens</h2>
        <List
          itemLayout="vertical"
          size="small"
          dataSource={tokens.ready ? tokens.list : undefined}
          renderItem={item => <Item item={item} />}
        />
      </AppLayout>
    );
  }
}

RegisterToken.propTypes = {
  tokens: PropTypes.object,
  network: PropTypes.object,
  bridge: PropTypes.object,
  match: PropTypes.object,
};
