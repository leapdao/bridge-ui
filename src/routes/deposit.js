/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { computed } from 'mobx';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { Select, Form, Input, Button, Table } from 'antd';
import ethUtil from 'ethereumjs-util';

import Web3SubmitWarning from '../components/web3SubmitWarning';
import TokenValue from '../components/tokenValue';
import { shortenHash } from '../utils';

@inject('tokens', 'bridge', 'network', 'unspents')
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
    const { tokens, unspents, bridge } = this.props;
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

    const utxoList =
      unspents && unspents.listForColor(this.selectedToken.color);

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
          <dd>
            <TokenValue
              value={this.selectedToken.balance}
              color={this.selectedToken.color}
            />
          </dd>
        </dl>

        {utxoList && (
          <Fragment>
            <h2 style={{ alignItems: 'center', display: 'flex' }}>
              Unspents ({this.selectedToken.symbol})
              {utxoList.length > 1 && (
                <Fragment>
                  {' '}
                  <Button
                    size="small"
                    onClick={() =>
                      unspents.consolidate(this.selectedToken.color)
                    }
                    style={{ marginLeft: 10 }}
                  >
                    Consolidate {this.selectedToken.symbol}
                  </Button>
                </Fragment>
              )}
            </h2>
            <Table
              style={{ marginTop: 15 }}
              columns={[
                { title: 'Value', dataIndex: 'value', key: 'value' },
                { title: 'Input', dataIndex: 'input', key: 'input' },
                { title: 'Height', dataIndex: 'height', key: 'height' },
                { title: 'Exit', dataIndex: 'exit', key: 'exit' },
              ]}
              dataSource={utxoList
                .sort(
                  (a, b) =>
                    b.transaction.blockNumber - a.transaction.blockNumber
                )
                .map(u => {
                  const inputHash = ethUtil.bufferToHex(u.outpoint.hash);
                  return {
                    value: <TokenValue {...u.output} />,
                    input: (
                      <Fragment>
                        <Link to={`/explorer/tx/${inputHash}`}>
                          {shortenHash(inputHash)}
                        </Link>{' '}
                        ({u.outpoint.index})
                      </Fragment>
                    ),
                    height: u.transaction.blockNumber,
                    exit: (
                      <Fragment>
                        {unspents.periodBlocksRange[0] >
                          u.transaction.blockNumber && (
                          <Button
                            size="small"
                            onClick={() => unspents.exitUnspent(u)}
                          >
                            Exit
                          </Button>
                        )}
                        {unspents.periodBlocksRange[0] <=
                          u.transaction.blockNumber && (
                          <span>
                            Wait until height {unspents.periodBlocksRange[1]}
                          </span>
                        )}
                      </Fragment>
                    ),
                  };
                })}
            />
          </Fragment>
        )}

        <Button onClick={() => bridge.finalizeExits(this.selectedToken.color)}>
          Finalize {this.selectedToken.symbol} exits
        </Button>
      </Fragment>
    );
  }
}

Deposit.propTypes = {
  unspents: PropTypes.object,
  tokens: PropTypes.object,
  bridge: PropTypes.object,
  network: PropTypes.object,
};
