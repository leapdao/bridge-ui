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
import Web3 from 'web3';
import { helpers, Period, Block, Tx } from 'parsec-lib';
import ethUtil from 'ethereumjs-util';

import Web3SubmitWarning from '../components/web3SubmitWarning';
import { range } from '../utils/range.ts';

const pWeb3 = helpers.extendWeb3(new Web3('https://testnet-1.parseclabs.org'));

function makePeriodFromRange(startBlock, endBlock) {
  return Promise.all(
    range(startBlock, endBlock - 1).map(n => pWeb3.eth.getBlock(n, true))
  ).then(blocks => {
    return new Period(
      null,
      blocks.map(({ number, timestamp, transactions }) => {
        const block = new Block(number, {
          timestamp,
          txs: transactions.map(tx => Tx.fromRaw(tx.raw)),
        });

        return block;
      })
    );
  });
}

@inject('tokens', 'bridge', 'network', 'account')
@observer
export default class Deposit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: 0,
      selectedIdx: 0,
      unspent: [],
    };
    this.handleSubmit = this.handleSubmit.bind(this);

    if (props.account && props.account.address) {
      this.fetchUnspent(props.account.address);
    }
  }

  componentWillReceiveProps({ account }) {
    if (account && account.address) {
      this.fetchUnspent(account.address);
    }
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

  fetchUnspent(address) {
    pWeb3
      .getUnspent(address)
      .then(unspent => {
        return Promise.all(
          unspent.map(u =>
            pWeb3.eth.getTransaction(ethUtil.bufferToHex(u.outpoint.hash))
          )
        ).then(transactions => {
          transactions.forEach((tx, i) => {
            unspent[i].transaction = tx;
          });

          return unspent;
        });
      })
      .then(unspent => {
        this.setState({ unspent });
      });
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

  handleExit(i) {
    const { bridge } = this.props;
    const u = this.state.unspent[i];
    const { blockNumber, raw } = u.transaction;
    const periodNumber = Math.floor(blockNumber / 32);
    const startBlock = periodNumber * 32;
    const endBlock = periodNumber * 32 + 32;

    makePeriodFromRange(startBlock, endBlock).then(period => {
      bridge.startExit(period.proof(Tx.fromRaw(raw)), u.outpoint.index);
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
    const { value, selectedIdx, unspent } = this.state;

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

        <hr />
        <h1>Exit</h1>
        <ul>
          {unspent.map((u, i) => (
            <li key={`${u.outpoint.index}-${u.transaction.hash}`}>
              Value: {u.output.value}
              <br />
              Color: {u.output.color}
              <br />
              <Button size="small" onClick={() => this.handleExit(i)}>
                Exit
              </Button>
            </li>
          ))}
        </ul>
      </Fragment>
    );
  }
}

Deposit.propTypes = {
  account: PropTypes.object,
  tokens: PropTypes.object,
  bridge: PropTypes.object,
  network: PropTypes.object,
};
