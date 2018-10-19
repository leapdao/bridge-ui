/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { computed, observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { Select, Form, Input, Button } from 'antd';
import autobind from 'autobind-decorator';

import TokenValue from '../../components/tokenValue';

@inject('tokens', 'bridge', 'network')
@observer
export default class Deposit extends React.Component {
  @computed
  get selectedToken() {
    const { tokens, color } = this.props;
    return tokens && tokens.tokenForColor(color);
  }

  @observable
  value = 0;

  @autobind
  handleSubmit(e) {
    e.preventDefault();
    const { bridge } = this.props;
    const value = this.selectedToken.isNft
      ? this.value
      : this.selectedToken.toCents(this.value);
    bridge.deposit(this.selectedToken, value).then(({ futureReceipt }) => {
      futureReceipt.once('transactionHash', depositTxHash => {
        console.log('deposit', depositTxHash); // eslint-disable-line
        this.value = 0;
      });
    });
  }

  @autobind
  handleChange(e) {
    this.value = e.target.value;
  }

  @autobind
  handleBlur() {
    if (!this.selectedToken.isNft) {
      this.value = Number(this.value) || 0;
    }
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

    const tokenSelect = (
      <Select
        defaultValue={color}
        style={{ width: this.selectedToken.isNft ? 120 : 80 }}
        onChange={newColor => {
          onColorChange(newColor);
          this.value = tokens.tokenForColor(newColor).isNft ? '' : this.value;
        }}
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
        <h2>Make a deposit</h2>

        {this.selectedToken.isNft && (
          <p>
            {this.selectedToken.name} is non-fungible token. Please enter
            tokenId to deposit
          </p>
        )}

        <Form onSubmit={this.handleSubmit} layout="inline">
          {this.selectedToken.isNft && (
            <Fragment>
              <Form.Item>
                <Select
                  defaultValue={this.value}
                  style={{
                    width: 250,
                  }}
                  onChange={id => {
                    this.value = id;
                  }}
                >
                  {this.selectedToken.balance.map(id => (
                    <Select.Option key={id} value={id}>
                      {id}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>{tokenSelect}</Form.Item>
            </Fragment>
          )}
          {!this.selectedToken.isNft && (
            <Form.Item>
              <Input
                placeholder="amount to deposit"
                value={this.value}
                onChange={this.handleChange}
                onBlur={this.handleBlur}
                addonAfter={tokenSelect}
                style={{ width: 300 }}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              disabled={!this.canSubmitValue(this.value)}
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
