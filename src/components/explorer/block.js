import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from 'antd';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';

import TransctionList from './transactionList';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

const Block = ({ explorer }) => {
  const block = explorer.current;
  const title = `Block ${block.number}`;
  return (
    <Card title={title} className="explorer-section">
      <div className="explorer-nav">
        <Button>
          <Link to={`/explorer/${block.number - 1}`}> Prev </Link>
        </Button>
        <Button>
          <Link to={`/explorer/${block.number + 1}`}> Next </Link>
        </Button>
      </div>
      <h3>Hash:</h3>
      {block.hash}
      <h3>Timestamp:</h3>
      {dateFormat.format(block.timestamp * 1000)}
      <h3>Transactions:</h3>
      <TransctionList txs={block.transactions} />
    </Card>
  );
};

Block.propTypes = {
  explorer: PropTypes.any,
};

export default inject('explorer')(observer(Block));
