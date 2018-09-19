import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from 'antd';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';

import TransctionList from './transactionList';

const Block = ({ explorer }) => {
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
      <Button>
        <Link to={`/explorer/${block.number - 1}`}> Prev </Link>
      </Button>
      <Button>
        <Link to={`/explorer/${block.number + 1}`}> Next </Link>
      </Button>
    </Card>
  );
};

Block.propTypes = {
  explorer: PropTypes.any,
};

export default inject('explorer')(observer(Block));
