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

import getWeb3 from '../utils/getWeb3';
import { bridge as bridgeAbi, token as tokenAbi } from '../utils/abis';
import Web3SubmitWarning from '../components/web3SubmitWarning';
import Web3SubmitWrapper from '../components/web3SubmitWrapper';

@inject(stores => ({
  tokens: stores.tokens.tokens,
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
    if (tokens[selectedColor] && tokens[selectedColor].ready) {
      return tokens[selectedColor];
    }

    return undefined;
  }

  handleSubmit(e) {
    e.preventDefault();
    const { account, bridgeAddress } = this.props;
    const value = new BigNumber(this.state.value).mul(
      10 ** this.selectedToken.decimals
    );
    const iWeb3 = getWeb3(true);
    const bridge = new iWeb3.eth.Contract(bridgeAbi, bridgeAddress);

    // do approveAndCall to token
    const token = new iWeb3.eth.Contract(tokenAbi, this.selectedToken.address);
    const data = bridge.methods
      .deposit(account, value, this.selectedToken.color)
      .encodeABI();

    token.methods
      .approveAndCall(bridgeAddress, value, data)
      .send({
        from: account,
      })
      .on('transactionHash', depositTxHash => {
        console.log('deposit', depositTxHash); // eslint-disable-line
        this.setState({ value: 0 });
      });
  }

  render() {
    const { account, network, tokens } = this.props;
    const { value, selectedColor } = this.state;

    if (!tokens || !this.selectedToken) {
      return null;
    }

    if (tokens.length === 0) {
      return (
        <div style={{ textAlign: 'center', margin: 50, fontSize: 18 }}>
          You need to register some token first
        </div>
      );
    }

    const tokenSelect = (
      <Select
        defaultValue={selectedColor}
        style={{ width: 80 }}
        onChange={color => this.setState({ selectedColor: color })}
      >
        {tokens.map(token => (
          <Select.Option key={token} value={token.color}>
            {token.symbol}
          </Select.Option>
        ))}
      </Select>
    );

    return (
      <Fragment>
        <h1>Make a deposit</h1>

        <Web3SubmitWarning account={account} network={network} />

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
            <Web3SubmitWrapper account={account} network={network}>
              {canSendTx => (
                <Button
                  htmlType="submit"
                  type="primary"
                  disabled={
                    !canSendTx || !value || value > this.selectedToken.balance
                  }
                >
                  Deposit
                </Button>
              )}
            </Web3SubmitWrapper>
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
  account: PropTypes.string,
  tokens: PropTypes.array,
  network: PropTypes.string.isRequired,
  bridgeAddress: PropTypes.string.isRequired,
};
