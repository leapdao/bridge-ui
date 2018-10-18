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
import { Select, Form, Input, Button } from 'antd';

import TokenValue from '../../components/tokenValue';

@inject('tokens', 'bridge', 'network')
@observer
export default class Deposit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: 0,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  @computed
  get selectedToken() {
    const { tokens, color } = this.props;
    return tokens && tokens.tokenForColor(color);
  }

  handleSubmit(e) {
    e.preventDefault();
    const { bridge } = this.props;
    const value = this.selectedToken.toCents(this.state.value);
    bridge.deposit(this.selectedToken, value).then(({ futureReceipt }) => {
      futureReceipt.once('transactionHash', depositTxHash => {
        console.log('deposit', depositTxHash); // eslint-disable-line
        this.setState({ value: 0 });
      });
    });
  }

  canSubmitValue(value) {
    const { network } = this.props;

    return (
      network.canSubmit ||
      value ||
      (this.selectedToken.isNft || value <= this.selectedToken.balance)
    );
  }

  render() {
    const { tokens, color, onColorChange } = this.props;
    const { value } = this.state;

    const tokenSelect = (
      <Select
        defaultValue={color}
        style={{ width: 80 }}
        onChange={idx => {
          onColorChange(tokens.list[idx].color);
          this.setState({
            value: tokens.list[idx].isNft ? '' : value,
          });
        }}
      >
        {tokens.list.map((token, idx) => (
          <Select.Option key={token} value={idx}>
            {token.symbol}
          </Select.Option>
        ))}
      </Select>
    );

    return (
      <Fragment>
        <h2>Make a deposit</h2>

        {this.selectedToken.isNft && (
          <p>
            {this.selectedToken.name} is non-fungible token. Please enter
            tokenId to deposit
          </p>
        )}

        <Form onSubmit={this.handleSubmit} layout="inline">
          <Form.Item>
            <Input
              placeholder={
                this.selectedToken.isNft ? 'token id' : 'amount to deposit'
              }
              value={value}
              onChange={e => this.setState({ value: e.target.value })}
              onBlur={() =>
                !this.selectedToken.isNft &&
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
              disabled={!this.canSubmitValue(value)}
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
          <dd>
            <TokenValue
              value={this.selectedToken.balance}
              color={this.selectedToken.color}
            />
          </dd>
          <dt>Plasma balance</dt>
          <dd>
            <TokenValue
              value={this.selectedToken.plasmaBalance}
              color={this.selectedToken.color}
            />
          </dd>
        </dl>
      </Fragment>
    );
  }
}

Deposit.propTypes = {
  tokens: PropTypes.object,
  bridge: PropTypes.object,
  network: PropTypes.object,
  onColorChange: PropTypes.func,
  color: PropTypes.number,
};
