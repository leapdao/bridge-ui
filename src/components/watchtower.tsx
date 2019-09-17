/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observable, reaction } from 'mobx';
import { Input, Outpoint, Tx } from 'leap-core';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { EventLog } from 'web3/types';
import autobind from 'autobind-decorator';
import { Alert, Button, Spin, List, Row, Col, Card, Collapse } from 'antd';

import TokenValue from '../components/tokenValue';
import HexString from '../components/hexString';
import { bridgeStore } from '../stores/bridge';
import { exitHandlerStore } from '../stores/exitHandler';
import { web3RootStore } from '../stores/web3/root';
import { explorerStore } from '../stores/explorer';
import { web3PlasmaStore } from '../stores/web3/plasma';
import { tokensStore } from '../stores/tokens';

interface ColorDetails {
  color: number;
  tokenSymbol: string;
  plasmaBalance: any; // proper types needed here
  utxoSum: any; // proper types needed here
  exitSum: any; // proper types needed here
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

interface WatchtowerProps {}

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

  constructor(props: WatchtowerProps) {
    super(props);
    reaction(() => tokensStore.ready, () => this.getData());
  }

  @observable
  private colorDetails: ColorDetails[] = [];

  private getData = async (): Promise<void> => {
    const exits = [];
    if (!bridgeStore.address) {
      await new Promise(resolve =>
        reaction(() => bridgeStore.address, resolve)
      );
    }
    const fromBlock = await bridgeStore.contract.methods
      .genesisBlockNumber()
      .call();
    const events = await exitHandlerStore.contract.getPastEvents(
      'ExitStarted',
      {
        fromBlock,
      }
    );
    await Promise.all(
      events.map(async event => {
        const utxoId = new Outpoint(
          event.returnValues.txHash,
          Number(event.returnValues.outIndex)
        ).getUtxoId();
        const exit = await exitHandlerStore.contract.methods
          .exits(web3RootStore.instance.utils.toHex(utxoId))
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
        const exitTx = await explorerStore.getTransaction(exitTxHash);
        if (exitTx === undefined) {
          suspect = true;
        }
        exits.push({ event, exit, suspect });
      })
    );

    const uTxos = await web3PlasmaStore.instance.getUnspentAll();
    const addresses = Object.values(
      await web3PlasmaStore.instance.getColors()
    ).flat();
    const colors = await Promise.all(
      addresses.map(async addr => {
        return web3PlasmaStore.instance.getColor(addr);
      })
    );
    const { toBN } = web3RootStore.instance.utils;
    const colorDetails = await Promise.all(
      colors.map(async color => {
        const utxoSum = uTxos.reduce((acc, utXo) => {
          return utXo.output.color === color
            ? toBN(utXo.output.value).add(acc)
            : acc;
        }, toBN(0));

        const exitSum = exits.reduce((acc, e) => {
          return Number(e.exit.color) === color && !e.exit.finalized
            ? toBN(e.exit.amount).add(acc)
            : acc;
        }, toBN(0));

        const plasmaBalance = toBN(
          await tokensStore.list
            .find(token => token.color === color)
            .contract.methods.balanceOf(exitHandlerStore.address)
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
          tokenSymbol: tokensStore.tokenForColor(color).symbol,
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

  @autobind
  private expandRenderer(props) {
    return (
      <Button onClick={e => props.onExpand(props.record, e)}>
        {props.expanded ? 'Hide exits' : 'Show exits'}
      </Button>
    );
  }

  public render() {
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
                <Row
                  style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
                  gutter={2}
                >
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
                        e => e.exit.finalized && e.suspect
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
