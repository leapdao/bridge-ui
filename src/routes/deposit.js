/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Select, Form, Input, Button } from 'antd';

import getWeb3 from '../utils/getWeb3';
import promisifyWeb3Call from '../utils/promisifyWeb3Call';
import { bridge as bridgeAbi, token as tokenAbi } from '../utils/abis';
import { bridgeAddress } from '../utils/addrs';
import Web3SubmitWarning from '../components/web3SubmitWarning';
import Web3SubmitWrapper from '../components/web3SubmitWrapper';
import getBridgeTokens from '../utils/getBridgeTokens';

export default class Deposit extends React.Component {
  constructor(props) {
    super(props);

    const psc = { color: 0, symbol: 'PSC' };

    this.state = {
      value: 0,
      tokens: [psc],
      selectedToken: psc,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    getBridgeTokens().then(tokens => {
      this.setState({ tokens, selectedToken: tokens[0] });
      this.fetchTokenBalances(this.props.account);
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.account !== nextProps.account) {
      this.fetchTokenBalances(nextProps.account);
    }
  }

  fetchTokenBalances(account) {
    return Promise.all(
      this.state.tokens.map(tokenData => {
        const token = getWeb3(true)
          .eth.contract(tokenAbi)
          .at(tokenData.address);
        return promisifyWeb3Call(token.balanceOf, account).then(balance =>
          Object.assign(tokenData, {
            balance: Number(balance.div(10 ** tokenData.decimals)),
          })
        );
      })
    );
  }

  handleSubmit(e) {
    e.preventDefault();
    const { account } = this.props;
    const { BigNumber } = getWeb3();
    const { selectedToken } = this.state;
    const value = new BigNumber(this.state.value).mul(
      10 ** selectedToken.decimals
    );
    const web3 = getWeb3(true);
    const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);

    // do approveAndCall to token
    const token = web3.eth.contract(tokenAbi).at(selectedToken.address);
    const data = bridge.deposit.getData(account, value, selectedToken.color);
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
    const { account, network } = this.props;
    const { value, tokens, selectedToken } = this.state;

    const tokenSelect = (
      <Select
        defaultValue={selectedToken.color}
        style={{ width: 80 }}
        onChange={color => this.setState({ selectedToken: tokens[color] })}
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
                    !canSendTx || !value || value > selectedToken.balance
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
          <dd>{selectedToken.name}</dd>
          <dt>Token contract address</dt>
          <dd>{selectedToken.address}</dd>
          <dt>Token balance</dt>
          <dd>{selectedToken.balance}</dd>
        </dl>
      </Fragment>
    );
  }
}

Deposit.propTypes = {
  account: PropTypes.string,
  network: PropTypes.string.isRequired,
};
