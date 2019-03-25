import * as React from 'react';
import { Table } from 'antd';
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
      value: tx.value,
      color: tx.color,
      outputs: tx.outputs,
      type: TYPES[tx.type],
    };
  });
  const columns = [
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
      title: 'Outputs',
      dataIndex: 'outputs',
      key: 'outputs',
      render: (outputs, tx) => {
        if (outputs && outputs.length) {
          return outputs.map((output, i) => (
            <div key={i} style={{ margin: '5px 0' }}>
              <Link to={`/explorer/address/${output.address}`}>
                {shortenHex(output.address)}
              </Link>
              <br />
              <TokenValue {...output} />
            </div>
          ));
        } else if (tx.type === 'EXIT') {
          return (
            <>
              Exit <TokenValue value={tx.value} color={tx.color} />
            </>
          );
        }
      },
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
