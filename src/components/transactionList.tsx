import * as React from 'react';
import { Table, List } from 'antd';
import { Type } from 'leap-core';
import { Link } from 'react-router-dom';

import TokenValue from './tokenValue';
import { shortenHex, swapObject } from '../utils';

const TYPES = swapObject(Type);

const TransactionList = ({ txs }) => {
  const transactions = txs.map(tx => {
    return {
      key: tx.hash,
      id: tx.transactionIndex,
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      outputs: tx.outputs,
      type: TYPES[tx.type],
    };
  });
  const columns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      render: text => (
        <Link to={`/explorer/tx/${text}`}>{shortenHex(text)}</Link>
      ),
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      render: text => (
        <Link to={`/explorer/address/${text}`}>{shortenHex(text)}</Link>
      ),
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      render: text => (
        <Link to={`/explorer/address/${text}`}>{shortenHex(text)}</Link>
      ),
    },
    {
      title: 'Outputs',
      dataIndex: 'outputs',
      key: 'outputs',
      render: outputs => (
        <List
          itemLayout="vertical"
          split={false}
          dataSource={outputs}
          renderItem={output => (
            <List.Item>
              Address:{' '}
              <Link to={`/explorer/address/${output.address}`}>
                {shortenHex(output.address)}
              </Link>
              <br />
              Value: <TokenValue {...output} />
            </List.Item>
          )}
        />
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
  ];

  return (
    <div className="leap-table">
      <Table dataSource={transactions} columns={columns} />
    </div>
  );
};

export default TransactionList;
