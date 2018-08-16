import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'antd';

const TransactionList = ({ txs }) => {
  const transactions = txs.map(tx => {
    const x = {
      id: tx.transactionIndex,
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
    };
    return x;
  });
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
    },
  ];

  return <Table dataSource={transactions} columns={columns} />;
};

TransactionList.propTypes = {
  txs: PropTypes.any,
};

export default TransactionList;
