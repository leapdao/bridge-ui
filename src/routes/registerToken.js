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
import getWeb3 from '../utils/getWeb3';
import { bridge as bridgeAbi } from '../utils/abis';
import Web3SubmitWarning from '../components/web3SubmitWarning';
import Web3SubmitWrapper from '../components/web3SubmitWrapper';

const Item = observer(({ item }) => (
  <List.Item key={item.address}>
    <List.Item.Meta
      title={`${item.name} (${item.symbol})`}
      description={item.address}
    />
  </List.Item>
));

@inject(stores => ({
  tokens: stores.tokens.tokens,
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
    const { account, bridgeAddress } = this.props;
    const { tokenAddr } = this.state;

    const iWeb3 = getWeb3(true);
    const bridge = new iWeb3.eth.Contract(bridgeAbi, bridgeAddress);
    bridge.methods
      .registerToken(tokenAddr)
      .send({
        from: account,
      })
      .on('transactionHash', registerTxHash => {
        console.log('registerToken', registerTxHash); // eslint-disable-line
        this.setState({ tokenAddr: '' });
      });
  }

  render() {
    const { account, network, tokens } = this.props;
    const { tokenAddr } = this.state;

    return (
      <Fragment>
        <h1>Register a new ERC827 token</h1>

        <Web3SubmitWarning account={account} network={network} />

        <Form onSubmit={this.handleSubmit} layout="inline">
          <Form.Item>
            <Input
              value={tokenAddr}
              onChange={e => this.setState({ tokenAddr: e.target.value })}
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
                    !canSendTx || !tokenAddr || !isValidAddress(tokenAddr)
                  }
                >
                  Register token
                </Button>
              )}
            </Web3SubmitWrapper>
          </Form.Item>
        </Form>

        <h2 style={{ marginBottom: 16, marginTop: 32 }}>Registered tokens</h2>
        <List
          itemLayout="vertical"
          size="small"
          dataSource={tokens && tokens[0] && tokens[0].ready && tokens}
          renderItem={item => <Item item={item} />}
        />
      </Fragment>
    );
  }
}

RegisterToken.propTypes = {
  account: PropTypes.string,
  tokens: PropTypes.array,
  network: PropTypes.string.isRequired,
  bridgeAddress: PropTypes.string.isRequired,
};
