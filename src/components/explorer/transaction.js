import React from 'react';
import PropTypes from 'prop-types';
import { Card, List } from 'antd';

import { observer, inject } from 'mobx-react';

import Searchable from './searchable';

const Transaction = ({ explorer }) => {
  const tx = explorer.current;
  console.log(tx.inputs);
  return (
    <Card title="Transaction">
      <h3> Hash: </h3>
      {tx.hash}
      <h3> Block: </h3>
      <Searchable text={tx.blockHash} />
      <h3> ID in block: </h3>
      {tx.transactionIndex}
      <h3> From: </h3>
      <Searchable text={tx.from} />
      <h3> To: </h3>
      <Searchable text={tx.to} />
      <h3> Value: </h3>
      {tx.value}
      <h3> Inputs: </h3>
      <List
        itemLayout="vertical"
        dataSource={tx.inputs}
        renderItem={input => (
          <List.Item>
            <Searchable text={input.hash} />
          </List.Item>
        )}
      />
    </Card>
  );
};

Transaction.propTypes = {
  explorer: PropTypes.any,
};

export default inject('explorer')(observer(Transaction));
