import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from 'antd';
import { observer, inject } from 'mobx-react';

import TransctionList from './transactionList';

const Block = inject('explorer')(
  observer(({ explorer }) => {
    const block = explorer.current;
    const title = `Block ${block.number}`;
    return (
      <Card title={title}>
        <h3> Hash: </h3>
        {block.hash}
        <h3> Timestamp: </h3>
        {block.timestamp}
        <h3> Transactions: </h3>
        <TransctionList txs={block.transactions} />
        <Button onClick={() => explorer.search(block.number - 1)}>
          {' '}
          Prev{' '}
        </Button>
        <Button onClick={() => explorer.search(block.number + 1)}>
          {' '}
          Next{' '}
        </Button>
      </Card>
    );
  })
);

Block.propTypes = {
  explorer: PropTypes.any,
};

export default Block;
