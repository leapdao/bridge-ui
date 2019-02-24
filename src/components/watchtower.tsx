/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { Alert, Button, Spin, List, Row, Col, Card, Collapse } from 'antd';
import { Link } from 'react-router-dom';
import { BN } from 'web3-utils';
import { Input, Outpoint, Tx } from 'leap-core';
import { action, observable, reaction, runInAction, autorun } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { EventLog } from 'web3/types';
import TokenValue from '../components/tokenValue';
import HexString from '../components/hexString';
import Bridge from '../stores/bridge';
import ExitHandler from '../stores/exitHandler';
import Explorer from '../stores/explorer';
import Tokens from '../stores/tokens';
import Web3Store from '../stores/web3';

interface ColorDetails {
  color: number;
  tokenSymbol: string;
  plasmaBalance: BN;
  utxoSum: BN;
  exitSum: BN;
  isOk: boolean;
  hasBadFinalizedExits: boolean;
  hasBadOpenExits: boolean;
  exitDetails: ExitData[];
}

interface ExitData {
  event: EventLog;
  exit: {
    amount: string;
    color: string;
    owner: string;
    finalized: boolean;
    priorityTimestamp: string;
    stake: string;
    0: string;
    1: string;
    2: string;
    3: boolean;
    4: string;
    5: string;
  };
  suspect: boolean;
}

interface WatchtowerProps {
  exitHandler?: ExitHandler;
  explorer?: Explorer;
  bridge?: Bridge;
  web3?: Web3Store;
  tokens?: Tokens;
}

@inject('exitHandler', 'explorer', 'web3', 'tokens', 'bridge', 'tokens')
@observer
export default class Watchtower extends React.Component<WatchtowerProps, {}> {
  private renderExit(record) {
    return (
      <List.Item>
        <List.Item.Meta
          title={
            <div
              style={{
                color: record.suspect ? 'red' : 'green',
              }}
            >
              <TokenValue
                value={record.exit.amount}
                color={record.exit.color}
              />
            </div>
          }
          description={
            <div>
              <div>
                <Link to={`/explorer/address/${record.exit.owner}`}>
                  <HexString>{record.exit.owner}</HexString>
                </Link>
              </div>
              <div>
                {new Date(
                  Number(record.exit.priorityTimestamp) * 1000
                ).toUTCString()}
              </div>
            </div>
          }
        />
      </List.Item>
    );
  }
  /*
  private colorColums: ColumnProps<any>[] = [
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
    },
    {
      title: 'Plasma balance',
      dataIndex: 'plasmaBalance',
      key: 'plasmaBalance',
      render: (value, record) => (
        <TokenValue value={value} color={record.color} />
      ),
    },
    {
      title: 'Utxo Sum',
      dataIndex: 'utxoSum',
      key: 'utxoSum',
      render: (value, record) => (
        <TokenValue value={value} color={record.color} />
      ),
    },
    {
      title: 'Open Exit Sum',
      dataIndex: 'exitSum',
      key: 'exitSum',
      render: (value, record) => (
        <TokenValue value={value} color={record.color} />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (value, record: ColorDetails) => {
        return record.plasmaBalance.gte(record.exitSum.add(record.utxoSum)) ? (
          <Badge status="success" text="Ok" />
        ) : (
          <Badge status="warning" text="Invalid" />
        );
      },
    },
  ]; */

  constructor(props) {
    super(props);
    autorun(this.getData);
  }

  @observable colorDetails: ColorDetails[] = [];

  private getData = async (): Promise<void> => {
    const { exitHandler, explorer, web3, tokens, bridge } = this.props;
    const exits = [];
    if (!bridge.address)
      await new Promise(resolve => reaction(() => bridge.address, resolve));
    const fromBlock = await bridge.contract.methods.genesisBlockNumber().call();
    const events = await exitHandler.contract.getPastEvents('ExitStarted', {
      fromBlock,
    });
    await Promise.all(
      events.map(async event => {
        const utxoId = new Outpoint(
          event.returnValues.txHash,
          Number(event.returnValues.outIndex)
        ).getUtxoId();
        const exit = await exitHandler.contract.methods
          .exits(web3.root.instance.utils.toHex(utxoId))
          .call();
        let suspect;
        const exitTxHash = Tx.exit(
          new Input(
            new Outpoint(
              event.returnValues.txHash,
              Number(event.returnValues.outIndex)
            )
          )
        ).hash();
        const exitTx = await explorer.getTransaction(exitTxHash);
        if (exitTx === undefined) {
          suspect = true;
        }
        exits.push({ event, exit, suspect });
      })
    );

    const uTxos = await web3.plasma.instance.getUnspentAll();
    const addresses = await web3.plasma.instance.getColors();
    const colors = await Promise.all(
      addresses.map(async addr => {
        return web3.plasma.instance.getColor(addr);
      })
    );
    const colorDetails = await Promise.all(
      colors.map(async color => {
        const utxoSum = uTxos.reduce((acc, utXo) => {
          return utXo.output.color === color
            ? new BN(utXo.output.value).add(acc)
            : acc;
        }, new BN(0));

        const exitSum = exits.reduce((acc, e) => {
          return Number(e.exit.color) === color && !e.exit.finalized
            ? new BN(e.exit.amount).add(acc)
            : acc;
        }, new BN(0));

        const plasmaBalance = new BN(
          await tokens.list
            .find(token => token.color === color)
            .contract.methods.balanceOf(exitHandler.address)
            .call()
        );
        const exitDetails = exits.filter(e => Number(e.exit.color) === color);
        const hasBadFinalizedExits = exitDetails.reduce(
          (acc, e) => (e.exit.finalized && e.suspect ? true : acc),
          false
        );
        const hasBadOpenExits = exitDetails.reduce(
          (acc, e) => (!e.exit.finalized && e.suspect ? true : acc),
          false
        );
        return {
          utxoSum,
          exitSum,
          plasmaBalance,
          color,
          tokenSymbol: this.props.tokens.tokenForColor(color).symbol,
          isOk: plasmaBalance.gte(exitSum.add(utxoSum)),
          hasBadFinalizedExits,
          hasBadOpenExits,
          exitDetails,
        };
      })
    );
    this.colorDetails = colorDetails;
  };

  private exitDetailsRenderer = (openExits, badFinalizedExits) => {
    return (
      <>
        <h3>Open exits</h3>
        <List
          split
          pagination={{ pageSize: 10 }}
          dataSource={openExits}
          renderItem={this.renderExit}
        />
        <h3>Bad finalized exits</h3>
        <List
          split
          pagination={{ pageSize: 10 }}
          dataSource={badFinalizedExits}
          renderItem={this.renderExit}
        />
      </>
    );
  };

  expandRenderer = props => {
    let text;
    return (
      <Button onClick={e => props.onExpand(props.record, e)}>
        {props.expanded ? 'Hide exits' : 'Show exits'}
      </Button>
    );
  };
  render() {
    return (
      <>
        {this.colorDetails.length ? (
          this.colorDetails.map(detail => {
            return (
              <Card
                title={detail.tokenSymbol}
                headStyle={
                  detail.isOk
                    ? { backgroundColor: '#52c41a' }
                    : { backgroundColor: '#f5222d' }
                }
                style={{ marginTop: '1rem' }}
              >
                <Row gutter={2}>
                  {!detail.isOk && (
                    <Col span={8}>
                      <Alert
                        message={`${
                          detail.tokenSymbol
                        } Plasma contract balance is < UTXOs + open exits!`}
                        type="error"
                      />{' '}
                    </Col>
                  )}
                  {detail.hasBadFinalizedExits && (
                    <Col span={8}>
                      {' '}
                      <Alert
                        message={`Invalid ${
                          detail.tokenSymbol
                        } exits have already been finalized!`}
                        type="error"
                      />{' '}
                    </Col>
                  )}
                  {detail.hasBadOpenExits && (
                    <Col span={8}>
                      <Alert
                        message={`Some invalid ${
                          detail.tokenSymbol
                        } exits are not yet finalized, challenge them!`}
                        type="warning"
                      />
                    </Col>
                  )}
                </Row>
                <Row style={{paddingTop: '1rem', paddingBottom: '1rem'}} gutter={2}>
                  <Col span={8}>
                    <h3>Plasma Balance</h3>
                    <TokenValue
                      value={detail.plasmaBalance}
                      color={detail.color}
                    />
                  </Col>
                  <Col span={8}>
                    <h3>UTXO Total</h3>
                    <TokenValue value={detail.utxoSum} color={detail.color} />
                  </Col>
                  <Col span={8}>
                    <h3>Open Exit Total</h3>
                    <TokenValue value={detail.exitSum} color={detail.color} />
                  </Col>
                </Row>
                <Collapse bordered={false} defaultActiveKey={['1']}>
                  <Collapse.Panel header="Open exits" key="1">
                    <List
                      split
                      pagination={{ pageSize: 10 }}
                      dataSource={detail.exitDetails.filter(
                        e => !e.exit.finalized
                      )}
                      renderItem={this.renderExit}
                    />
                  </Collapse.Panel>
                  <Collapse.Panel header="Invalid finalized exits" key="2">
                    <List
                      split
                      pagination={{ pageSize: 10 }}
                      dataSource={detail.exitDetails.filter(
                        e=> e.exit.finalized && e.suspect
                      )}
                      renderItem={this.renderExit}
                    />
                  </Collapse.Panel>
                </Collapse>
              </Card>
            );
          })
        ) : (
          <Spin style={{ margin: 'auto' }} />
        )}
      </>
    );
  }
}
