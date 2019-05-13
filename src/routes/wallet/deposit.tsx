/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { computed, observable, reaction, autorun } from 'mobx';
import { observer } from 'mobx-react';
import { Form, Button, Table } from 'antd';
import autobind from 'autobind-decorator';
import { BigIntType, bi, ZERO, greaterThan, lessThanOrEqual } from 'jsbi-utils';
import { EventLog } from 'web3/types';

import TokenValue from '../../components/tokenValue';
import AmountInput from '../../components/amountInput';
import storage from '../../utils/storage';
import EtherscanLink from '../../components/etherscanLink';
import HexString from '../../components/hexString';
import { tokensStore } from '../../stores/tokens';
import { plasmaConfigStore } from '../../stores/plasmaConfig';
import { unspentsStore } from '../../stores/unspents';
import { exitHandlerStore } from '../../stores/exitHandler';
import { networkStore } from '../../stores/network';
import { web3RootStore } from '../../stores/web3/root';

const { Fragment } = React;

interface DepositProps {
  color: number;
  onColorChange: (color: number) => void;
}

type PendingDeposit = {
  value: string;
  color: number;
  txId: string;
  blockNumber?: number;
};

@observer
export default class Deposit extends React.Component<DepositProps, any> {
  @computed
  get selectedToken() {
    const { color } = this.props;
    return tokensStore.tokenForColor(color);
  }

  @observable
  private value: number | string = 0;

  @observable
  public pendingDeposits: { [key: string]: PendingDeposit };

  private storageKey: string;

  constructor(props: DepositProps) {
    super(props);

    this.storageKey = `pendingDeposits-${exitHandlerStore.address}`;
    exitHandlerStore.contract.events.NewDeposit({}, this.handleNewDeposit);

    reaction(() => unspentsStore.list, () => this.checkPendingDeposits());

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
    const { rootEventDelay } = plasmaConfigStore;
    const maturedDeposits = Object.values(this.pendingDeposits)
      .filter(
        pending => this.blocksSince(pending.blockNumber) >= rootEventDelay
      )
      .sort((a, b) => b.blockNumber - a.blockNumber);

    const utxos = unspentsStore.list;
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
  private handleNewDeposit(_, event: EventLog) {
    const pending = this.pendingDeposits[event.transactionHash];
    if (pending) {
      pending.blockNumber = event.blockNumber;
    }
  }

  @autobind
  private handleSubmit(e) {
    e.preventDefault();
    const { color } = this.props;
    const value = this.selectedToken.toCents(this.value);
    exitHandlerStore
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

  private canSubmitValue(value: BigIntType) {
    return (
      networkStore.canSubmit &&
      value &&
      greaterThan(bi(value), ZERO) &&
      (this.selectedToken.isNft ||
        lessThanOrEqual(bi(value), this.selectedToken.balance))
    );
  }

  private blocksSince(blockNumber: number) {
    if (blockNumber === undefined) {
      return 0;
    }
    const blocksSince = Math.min(
      plasmaConfigStore.rootEventDelay,
      web3RootStore.latestBlockNum - blockNumber
    );
    return Math.max(0, blocksSince);
  }

  public render() {
    const { color, onColorChange } = this.props;

    const { rootEventDelay } = plasmaConfigStore;

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
                this.value = tokensStore.tokenForColor(newColor).isNft
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
