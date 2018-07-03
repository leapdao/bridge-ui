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
import { bridgeAddress } from '../utils/addrs';
import Web3SubmitWarning from '../components/web3SubmitWarning';
import Web3SubmitWrapper from '../components/web3SubmitWrapper';

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
    const { decimals, account, tokenAddress } = this.props;
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
    const { symbol, balance, decimals, account, network } = this.props;
    const { value } = this.state;
    const bal = balance && Number(balance.div(decimals));

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
              addonAfter={symbol}
              style={{ width: 300 }}
            />
          </Form.Item>

          <Form.Item>
            <Web3SubmitWrapper account={account} network={network}>
              {canSendTx => (
                <Button
                  htmlType="submit"
                  type="primary"
                  disabled={!canSendTx || !value || value > bal}
                >
                  Deposit
                </Button>
              )}
            </Web3SubmitWrapper>
          </Form.Item>
        </Form>
      </Fragment>
    );
  }
}

Deposit.propTypes = {
  decimals: PropTypes.object.isRequired,
  account: PropTypes.string,
  symbol: PropTypes.string.isRequired,
  tokenAddress: PropTypes.string.isRequired,
  balance: PropTypes.object,
  network: PropTypes.string.isRequired,
};
