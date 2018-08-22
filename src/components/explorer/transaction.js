import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'antd';

import { observer, inject } from 'mobx-react';

const Transaction = inject('explorer')(
  observer(({ explorer }) => {
    const tx = explorer.current;
    /* eslint-disable */
    const searchable = text => {
      return (
        <a role="button" onClick={() => explorer.search(text)}>
          {text}
        </a>
      );
    };
    /* eslint-enable */
    return (
      <Card title="Transaction">
        <h3> Hash: </h3>
        {tx.hash}
        <h3> Block: </h3>
        {searchable(tx.blockHash)}
        <h3> ID in block: </h3>
        {tx.transactionIndex}
        <h3> From: </h3>
        {searchable(tx.from)}
        <h3> To: </h3>
        {searchable(tx.to)}
        <h3> Value: </h3>
        {tx.value}
      </Card>
    );
  })
);

Transaction.propTypes = {
  explorer: PropTypes.any,
};

export default Transaction;
