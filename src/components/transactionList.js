import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'antd';
import { Type } from 'parsec-lib';
import { Link } from 'react-router-dom';

import TokenValue from './tokenValue';
import { shortenHash, swapObject } from '../utils';

const TYPES = swapObject(Type);

const TransactionList = ({ txs }) => {
  const transactions = txs.map(tx => {
    return {
      id: tx.transactionIndex,
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: { value: tx.value, color: tx.color },
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
        <Link to={`/explorer/tx/${text}`}>{shortenHash(text)}</Link>
      ),
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      render: text => (
        <Link to={`/explorer/address/${text}`}>{shortenHash(text)}</Link>
      ),
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      render: text => (
        <Link to={`/explorer/address/${text}`}>{shortenHash(text)}</Link>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: props => props.color && <TokenValue {...props} />,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
  ];

  return <Table dataSource={transactions} columns={columns} />;
};

TransactionList.propTypes = {
  txs: PropTypes.any,
};

export default TransactionList;
