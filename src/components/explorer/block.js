import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'antd';

import TransctionList from './transactionList';

const Block = ({ block }) => {
  const title = `Block ${block.number}`;
  return (
    <Card title={title}>
      <h3> Hash: </h3>
      {block.hash}
      <h3> Timestamp: </h3>
      {block.timestamp}
      <h3> Transactions: </h3>
      <TransctionList txs={block.transactions} />
    </Card>
  );
};

Block.propTypes = {
  block: PropTypes.any,
};

export default Block;
