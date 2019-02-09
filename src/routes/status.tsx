/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { action, reaction, runInAction, observable } from 'mobx';
import AppLayout from '../components/appLayout';
import { default as Monitor } from '../components/monitor';
import { Table, Spin, Button, Badge } from 'antd';

import { CONFIG } from '../config';
import ExitHandler from '../stores/exitHandler';
import Explorer from '../stores/explorer';
import Web3Store from '../stores/web3';
import { Input, Outpoint, Tx } from 'leap-core';
import BN from 'bn.js';
import Tokens from '../stores/tokens';
import TokenValue from '../components/tokenValue';
import { ColumnProps } from 'antd/lib/table';
import { EventLog } from 'web3/types';

interface StatusProps {
  exitHandler: ExitHandler;
  explorer: Explorer;
  web3: Web3Store;
  tokens: Tokens;
}

interface ColorDetails {
  color: number;
  plasmaBalance: BN;
  utxoSum: BN;
  exitSum: BN;
}

interface ExitData {
  event: EventLog
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
  }
  suspect: boolean
}

@inject('exitHandler', 'explorer', 'web3', 'tokens')
@observer
export default class Status extends React.Component<StatusProps, {}> {
  private exitColumns: ColumnProps<any>[] = [
    {
      title: 'Amount',
      dataIndex: 'exit.amount',
      key: 'amount',
      render: (value, record) => (
        <TokenValue value={value} color={record.exit.color} />
      )
    },
    {
      title: 'Owner',
      dataIndex: 'exit.owner',
      key: 'owner'
    },
    {
      title: 'PriorityTimestamp',
      dataIndex: 'exit.priorityTimestamp',
      key: 'priorityTimestamp',
      render: text => {
        return <p>{new Date(parseInt(text) * 1000).toUTCString()}</p>;
      }
    },
    {
      title: 'Stake',
      dataIndex: 'exit.stake',
      key: 'stake',
      render: (value, record) => (
        <TokenValue value={value} color={record.exit.color} />
      )
    },
    {
      title: 'Suspicious',
      dataIndex: 'suspect',
      key: 'suspect',
      render: suspect => {
        if (suspect) return <p style={{ color: 'red' }}>Yes</p>;
        else return <p style={{ color: 'green' }}>No</p>;
      }
    }
  ];

  private colorColums: ColumnProps<any>[] = [
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color'
    },
    {
      title: 'Plasma balance',
      dataIndex: 'plasmaBalance',
      key: 'plasmaBalance',
      render: (value, record) => (
        <TokenValue value={value} color={record.color} />
      )
    },
    {
      title: 'Utxo Sum',
      dataIndex: 'utxoSum',
      key: 'utxoSum',
      render: (value, record) => (
        <TokenValue value={value} color={record.color} />
      )
    },
    {
      title: 'Exit Sum',
      dataIndex: 'exitSum',
      key: 'exitSum',
      render: (value, record) => (
        <TokenValue value={value} color={record.color} />
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (value, record: ColorDetails) => {
        return record.plasmaBalance.gte(record.exitSum.add(record.utxoSum)) ? (
          <Badge status='success' text='Ok' />
        ) : (
          <Badge status='warning' text='Invalid' />
        );
      }
    }
  ];

  constructor(props) {
    super(props);
    reaction(() => props.exitHandler.address, this.getData)
  }

  @observable exitDetails: ExitData[] = [];
  @observable colorDetails: ColorDetails[] = [];

  @action
  private getData = async (): Promise<void> => {
    const { exitHandler, explorer, web3, tokens } = this.props;
    const exits = []
    const events = await exitHandler.contract.getPastEvents('ExitStarted', {fromBlock: 0})
    await Promise.all(events.map(async (event) => {
      const utxoId = new Outpoint(event.returnValues.txHash, parseInt(event.returnValues.outIndex)).getUtxoId();
      const exit = await exitHandler.contract.methods.exits(web3.root.instance.utils.toHex(utxoId)).call();
      let suspect;
      if(!exit.finalized) {
        const exitTxHash = Tx.exit(
          new Input(
            new Outpoint(
              event.returnValues.txHash,
              parseInt(event.returnValues.outIndex)
            )
          )
        ).hash();
        const exitTx = await explorer.getTransaction(exitTxHash);
        if (exitTx === undefined) {
          suspect = true;
        }
      }
      exits.push({ event, exit, suspect } );
    }));

    const uTxos = await web3.plasma.instance.getUnspent('0x0'); //TODO: fix when leap web3 extension updated
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
            ? web3.root.instance.utils.toBN(utXo.output.value).add(acc)
            : acc;
        }, web3.root.instance.utils.toBN(0));

        const exitSum = exits.reduce((acc, e) => {
          return parseInt(e.exit.color) === color
            ? web3.root.instance.utils.toBN(e.exit.amount).add(acc)
            : acc;
        }, web3.root.instance.utils.toBN(0));

        const plasmaBalance = web3.root.instance.utils.toBN(
          await tokens.list
            .find(token => token.color === color)
            .contract.methods.balanceOf(exitHandler.address)
            .call()
        );
        return {
          utxoSum,
          exitSum,
          plasmaBalance,
          color
        };
      })
    );
    runInAction(() => {
      this.exitDetails = exits;
      this.colorDetails = colorDetails;
    });
  };

  private exitDetailsRenderer = record => {
    if (!this.exitDetails.length) return 'No open exits';
    const openExits = this.exitDetails.filter(
      e => parseInt(e.exit.color) === record.color
    );
    return openExits.length ? (
      <Table dataSource={openExits} columns={this.exitColumns} />
    ) : (
      'No open exits for this token'
    );
  };

  expandRenderer = props => {
    let text;
    return (
      <Button onClick={e => props.onExpand(props.record, e)}>
        {props.expanded ? 'Hide open exits' : 'Show open exits'}
      </Button>
    );
  };
  render() {
    return (
      <AppLayout section='status'>
        <h1>Nodes status</h1>
        <Monitor nodes={CONFIG.nodes} />
        {this.colorDetails.length ? (
          <Table
            style= {{paddingTop: "2rem"}}
            bordered
            dataSource={this.colorDetails}
            columns={this.colorColums}
            expandedRowRender={this.exitDetailsRenderer}
            expandIcon={this.expandRenderer}
            title={() => <h1>Watchtower</h1>}
          />
        ) : (
          <Spin style={{ margin: 'auto' }} />
        )}
      </AppLayout>
    );
  }
}
