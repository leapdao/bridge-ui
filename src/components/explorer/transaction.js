import React from 'react';
import PropTypes from 'prop-types';
import { Card, List } from 'antd';

import { observer, inject } from 'mobx-react';
import { Type } from 'parsec-lib';

import Searchable from './searchable';
import { swapObject } from '../../utils';

const TYPES = swapObject(Type);

const Transaction = ({ explorer }) => {
  const tx = explorer.current;
  return (
    <Card title="Transaction" className="explorer-section">
      <h3>Hash:</h3>
      {tx.hash}
      <h3>Block:</h3>
      <Searchable text={tx.blockHash} />
      <h3>ID in block:</h3>
      {tx.transactionIndex}
      <h3>From:</h3>
      <Searchable text={tx.from} />
      <h3>To:</h3>
      <Searchable text={tx.to} />
      <h3>Value:</h3>
      {tx.value}
      <h3>Type:</h3>
      {TYPES[tx.type]}
      <h3>Inputs:</h3>
      <List
        itemLayout="vertical"
        dataSource={tx.inputs}
        renderItem={input => (
          <List.Item>
            <Searchable text={input.hash} />: {input.index}
          </List.Item>
        )}
      />
      <h3>Outputs:</h3>
      <List
        itemLayout="vertical"
        dataSource={tx.outputs}
        renderItem={output => (
          <List.Item>
            Address: <Searchable text={output.address} />
            <br />
            Color: {output.color}
            <br />
            Value: {output.value}
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
