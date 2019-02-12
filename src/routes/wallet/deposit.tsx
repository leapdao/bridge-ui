/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { computed, observable, reaction, autorun } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Form, Button, Table } from 'antd';
import autobind from 'autobind-decorator';

import { EventLog } from 'web3-core';

import TokenValue from '../../components/tokenValue';
import AmountInput from '../../components/amountInput';
import Tokens from '../../stores/tokens';
import Network from '../../stores/network';
import ExitHandler from '../../stores/exitHandler';
import { BigIntType, bi, ZERO, greaterThan, lessThanOrEqual } from 'jsbi-utils';
import PlasmaConfig from '../../stores/plasmaConfig';
import Unspents from '../../stores/unspents';
import storage from '../../utils/storage';
import Web3Store from '../../stores/web3';
import EtherscanLink from '../../components/etherscanLink';
import HexString from '../../components/hexString';

const { Fragment } = React;

interface DepositProps {
  tokens?: Tokens;
  network?: Network;
  exitHandler?: ExitHandler;
  color: number;
  plasmaConfig?: PlasmaConfig;
  unspents?: Unspents;
  web3?: Web3Store;
  onColorChange: (color: number) => void;
}

type PendingDeposit = {
  value: string;
  color: number;
  txId: string;
  blockNumber?: number;
};

@inject('tokens', 'exitHandler', 'network', 'plasmaConfig', 'unspents', 'web3')
@observer
export default class Deposit extends React.Component<DepositProps, any> {
  @computed
  get selectedToken() {
    const { tokens, color } = this.props;
    return tokens && tokens.tokenForColor(color);
  }

  @observable
  value: number | string = 0;

  @observable
  public pendingDeposits: { [key: string]: PendingDeposit };

  private storageKey: string;

  constructor(props) {
    super(props);

    this.storageKey = `pendingDeposits-${props.exitHandler.address}`;
    props.exitHandler.contract.events.NewDeposit({}, this.handleNewDeposit);

    reaction(() => props.unspents.list, () => this.checkPendingDeposits());

    this.loadPendingDeposits();
    reaction(() => this.selectedToken, this.loadPendingDeposits);
    autorun(this.storePendingDeposits);

    this.checkPendingDeposits();
  }

  @autobind
  private loadPendingDeposits() {
    const { color } = this.props;
    const deps = storage.load(this.storageKey);
    this.pendingDeposits = Object.keys(deps).reduce((colorDeps, txId) => {
      if (deps[txId].color === color) {
        colorDeps[txId] = deps[txId];
      }
      return colorDeps;
    }, {});
  }

  @autobind
  private storePendingDeposits() {
    storage.store(this.storageKey, this.pendingDeposits);
  }

  private checkPendingDeposits() {
    const { rootEventDelay } = this.props.plasmaConfig;
    const maturedDeposits = Object.values(this.pendingDeposits)
      .filter(pending => this.blocksSince(pending.blockNumber) >= rootEventDelay)
      .sort((a, b) => b.blockNumber - a.blockNumber);

    const utxos = this.props.unspents.list;
    for (let i = 0; i < utxos.length && maturedDeposits.length > 0; i++) {
      const depIndex = maturedDeposits.findIndex(
        dep => dep.value === utxos[i].output.value
      );
      if (depIndex >= 0) {
        delete this.pendingDeposits[maturedDeposits[depIndex].txId];
        maturedDeposits.splice(depIndex, 1);
      }
    }
  }

  @autobind
  handleNewDeposit(_, event: EventLog) {
    const pending = this.pendingDeposits[event.transactionHash];
    if (pending) {
      pending.blockNumber = event.blockNumber;
    }
  }

  @autobind
  handleSubmit(e) {
    e.preventDefault();
    const { exitHandler, color } = this.props;
    const value = this.selectedToken.toCents(this.value);
    exitHandler
      .deposit(this.selectedToken, String(value))
      .then(({ futureReceipt }) => {
        futureReceipt.once('transactionHash', depositTxHash => {
          this.pendingDeposits[depositTxHash] = {
            value: String(value),
            color,
            txId: depositTxHash,
          };
          this.value = 0;
        });
      });
  }

  canSubmitValue(value: BigIntType) {
    const { network } = this.props;
    return (
      network.canSubmit &&
      value &&
      greaterThan(bi(value), ZERO) &&
      (this.selectedToken.isNft ||
        lessThanOrEqual(bi(value), this.selectedToken.balance))
    );
  }

  private blocksSince(blockNumber: number) {
    if (blockNumber === undefined) return 0;
    const blocksSince = Math.min(
      this.props.plasmaConfig.rootEventDelay, 
      this.props.web3.root.latestBlockNum - blockNumber
    );
    return Math.max(0, blocksSince);
  }

  render() {
    const { tokens, color, onColorChange, plasmaConfig } = this.props;

    const { rootEventDelay } = plasmaConfig;

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
          <div className="wallet-input">
            <AmountInput
              placeholder="Amount to deposit"
              value={this.value}
              onChange={value => {
                this.value = value;
              }}
              color={color}
              onColorChange={newColor => {
                onColorChange(newColor);
                this.value = tokens.tokenForColor(newColor).isNft
                  ? ''
                  : this.value;
              }}
            />
          </div>

          <Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              disabled={
                !this.canSubmitValue(this.selectedToken.toCents(this.value))
              }
            >
              Deposit
            </Button>
          </Form.Item>
        </Form>

        <dl className="info" style={{ marginTop: 10 }}>
          <dt>Token name</dt>
          <dd>{this.selectedToken.name}</dd>
          <dt>Token contract address</dt>
          <dd>
            <HexString>{this.selectedToken.address}</HexString>
          </dd>
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
        {Object.values(this.pendingDeposits).length > 0 && (
          <Fragment>
            <h2 style={{ alignItems: 'center', display: 'flex' }}>
              Pending deposits
            </h2>

            <Table
              style={{ marginTop: 15 }}
              size="small"
              pagination={{ pageSize: 4 }}
              columns={[
                { title: 'Value', dataIndex: 'value', key: 'value' },
                { title: 'TxId', dataIndex: 'txId', key: 'txId' },
                { title: 'Blocks to wait', dataIndex: 'blocks', key: 'blocks' },
              ]}
              dataSource={Object.values(this.pendingDeposits).map(
                pendingDep => ({
                  ...pendingDep,
                  txId: <EtherscanLink value={pendingDep.txId} />,
                  blocks: `${this.blocksSince(
                    pendingDep.blockNumber
                  )}/${rootEventDelay}`,
                  value: this.selectedToken.toTokens(bi(pendingDep.value)),
                })
              )}
            />
          </Fragment>
        )}
      </Fragment>
    );
  }
}
