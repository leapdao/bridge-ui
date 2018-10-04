import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'antd';

import Searchable from './searchable';

const TransactionList = ({ txs }) => {
  const transactions = txs.map(tx => ({
    id: tx.transactionIndex,
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
  }));
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
      render: text => <Searchable text={text} />,
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      render: text => <Searchable text={text} />,
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      render: text => <Searchable text={text} />,
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
