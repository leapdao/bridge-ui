/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { computed } from 'mobx';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { Select, Form, Input, Button } from 'antd';

import Web3SubmitWarning from '../components/web3SubmitWarning';

@inject(stores => ({
  tokens: stores.tokens,
  bridge: stores.bridge,
  network: stores.network,
}))
@observer
export default class Deposit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: 0,
      selectedColor: 0,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  @computed
  get selectedToken() {
    const { selectedColor } = this.state;
    const { tokens } = this.props;
    if (tokens.list[selectedColor] && tokens.list[selectedColor].ready) {
      return tokens.list[selectedColor];
    }

    return undefined;
  }

  handleSubmit(e) {
    e.preventDefault();
    const { bridge } = this.props;
    const value = new BigNumber(this.state.value).mul(
      10 ** this.selectedToken.decimals
    );

    bridge.deposit(this.selectedToken, value).then(({ tx }) => {
      tx.once('transactionHash', depositTxHash => {
        console.log('deposit', depositTxHash); // eslint-disable-line
        this.setState({ value: 0 });
      });
    });
  }

  render() {
    const { network, tokens } = this.props;
    const { value, selectedColor } = this.state;

    if (!tokens.ready) {
      return null;
    }

    if (tokens.list.length === 0) {
      return (
        <div style={{ textAlign: 'center', margin: 50, fontSize: 18 }}>
          You need to register some token first
        </div>
      );
    }

    if (!this.selectedToken) {
      return null;
    }

    const tokenSelect = (
      <Select
        defaultValue={selectedColor}
        style={{ width: 80 }}
        onChange={color => this.setState({ selectedColor: color })}
      >
        {tokens.list.map(token => (
          <Select.Option key={token} value={token.color}>
            {token.symbol}
          </Select.Option>
        ))}
      </Select>
    );

    return (
      <Fragment>
        <h1>Make a deposit</h1>

        <Web3SubmitWarning />

        <Form onSubmit={this.handleSubmit} layout="inline">
          <Form.Item>
            <Input
              value={value}
              onChange={e => this.setState({ value: e.target.value })}
              onBlur={() =>
                this.setState(state => ({ value: Number(state.value) || 0 }))
              }
              addonAfter={tokenSelect}
              style={{ width: 300 }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              disabled={
                !network.canSubmit ||
                !value ||
                value > this.selectedToken.balance
              }
            >
              Deposit
            </Button>
          </Form.Item>
        </Form>

        <dl className="info" style={{ marginTop: 10 }}>
          <dt>Token name</dt>
          <dd>{this.selectedToken.name}</dd>
          <dt>Token contract address</dt>
          <dd>{this.selectedToken.address}</dd>
          <dt>Token balance</dt>
          <dd>{this.selectedToken.decimalsBalance}</dd>
        </dl>
      </Fragment>
    );
  }
}

Deposit.propTypes = {
  tokens: PropTypes.object,
  bridge: PropTypes.object,
  network: PropTypes.object,
};
