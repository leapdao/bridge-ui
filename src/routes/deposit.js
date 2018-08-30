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
      selectedIdx: 0,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  @computed
  get selectedToken() {
    const { selectedIdx } = this.state;
    const { tokens } = this.props;
    if (tokens.list[selectedIdx] && tokens.list[selectedIdx].ready) {
      return tokens.list[selectedIdx];
    }

    return undefined;
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
    const { tokens } = this.props;
    const { value, selectedIdx } = this.state;

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
        defaultValue={selectedIdx}
        style={{ width: 80 }}
        onChange={idx =>
          this.setState({
            selectedIdx: idx,
            value: tokens.list[idx].isNft ? '' : value,
          })
        }
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
        <h1>Make a deposit</h1>

        <Web3SubmitWarning />

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
