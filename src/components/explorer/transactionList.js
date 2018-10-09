import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'antd';
import { Type } from 'parsec-lib';

import Searchable from './searchable';
import TokenValue from '../tokenValue';
import { shortenHash, swapObject } from '../../utils';

const TYPES = swapObject(Type);

const TransactionList = ({ txs }) => {
  const transactions = txs.map(tx => {
    return {
      id: tx.transactionIndex,
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: { value: tx.value, color: tx.outputs[0] && tx.outputs[0].color },
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
      render: text => <Searchable text={text} title={shortenHash(text)} />,
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      render: text => <Searchable text={text} title={shortenHash(text)} />,
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      render: text => <Searchable text={text} title={shortenHash(text)} />,
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
