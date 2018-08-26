/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { List, Form, Input, Button } from 'antd';

import { isValidAddress } from 'ethereumjs-util';
import Web3SubmitWarning from '../components/web3SubmitWarning';

const Item = observer(({ item }) => (
  <List.Item key={item.address}>
    <List.Item.Meta
      title={`${item.name} (${item.symbol})`}
      description={item.address}
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
  constructor(props) {
    super(props);

    this.state = {
      tokenAddr: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    const { bridge } = this.props;
    const { tokenAddr } = this.state;

    bridge.registerToken(tokenAddr).on('transactionHash', registerTxHash => {
      console.log('registerToken', registerTxHash); // eslint-disable-line
      this.setState({ tokenAddr: '' });
    });
  }

  render() {
    const { network, tokens } = this.props;
    const { tokenAddr } = this.state;

    return (
      <Fragment>
        <h1>Register a new ERC20/ERC721 token</h1>

        <Web3SubmitWarning />

        <Form onSubmit={this.handleSubmit} layout="inline">
          <Form.Item>
            <Input
              value={tokenAddr}
              onChange={e => this.setState({ tokenAddr: e.target.value })}
              style={{ width: 300 }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              disabled={
                !network.canSubmit || !tokenAddr || !isValidAddress(tokenAddr)
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
      </Fragment>
    );
  }
}

RegisterToken.propTypes = {
  tokens: PropTypes.object,
  network: PropTypes.object,
  bridge: PropTypes.object,
};
