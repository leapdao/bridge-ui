import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'antd';

import { observer, inject } from 'mobx-react';

const TransactionList = inject('explorer')(
  observer(({ txs, explorer }) => {
    /* eslint-disable */
    const searchable = text => {
      return (
        <a role="button" onClick={() => explorer.search(text)}>
          {text}
        </a>
      );
    };
    /* eslint-enable */
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
        render: text => searchable(text),
      },
      {
        title: 'From',
        dataIndex: 'from',
        key: 'from',
        render: text => searchable(text),
      },
      {
        title: 'To',
        dataIndex: 'to',
        key: 'to',
        render: text => searchable(text),
      },
      {
        title: 'Value',
        dataIndex: 'value',
        key: 'value',
      },
    ];

    return <Table dataSource={transactions} columns={columns} />;
  })
);

TransactionList.propTypes = {
  txs: PropTypes.any,
  explorer: PropTypes.any,
};

export default TransactionList;
