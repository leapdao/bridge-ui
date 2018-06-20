/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Button } from 'antd';

import getWeb3 from '../utils/getWeb3';
import promisifyWeb3Call from '../utils/promisifyWeb3Call';
import { bridge as bridgeAbi, token as tokenAbi } from '../utils/abis';
import { bridgeAddress, tokenAddress } from '../utils/addrs';

export default class Deposit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    const { decimals, account } = this.props;
    const { BigNumber } = getWeb3();
    const value = new BigNumber(this.state.value).mul(decimals);
    const web3 = getWeb3(true);
    const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);

    // do approveAndCall to token
    const token = web3.eth.contract(tokenAbi).at(tokenAddress);
    const data = bridge.deposit.getData(account, value);
    promisifyWeb3Call(
      token.approveAndCall.sendTransaction,
      bridgeAddress,
      value,
      data,
      {
        from: account,
      }
    ).then(depositTxHash => {
      console.log('deposit', depositTxHash); // eslint-disable-line
      this.setState({ value: 0 });
    });
  }

  render() {
    const { symbol, balance, decimals } = this.props;
    const { value } = this.state;
    const bal = Number(balance.div(decimals));

    return (
      <Fragment>
        <h1>Make a deposit</h1>
        <Form onSubmit={this.handleSubmit} layout="inline">
          <Form.Item>
            <Input
              value={value}
              onChange={e => this.setState({ value: Number(e.target.value) })}
              addonAfter={symbol}
              style={{ width: 300 }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              disabled={!value || value > bal}
            >
              Deposit
            </Button>
          </Form.Item>
        </Form>
      </Fragment>
    );
  }
}

Deposit.propTypes = {
  decimals: PropTypes.object.isRequired,
  account: PropTypes.string.isRequired,
  symbol: PropTypes.string.isRequired,
  balance: PropTypes.object.isRequired,
};
