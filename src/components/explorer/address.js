import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'antd';
import { observer, inject } from 'mobx-react';

import TransctionList from './transactionList';

const Address = ({ explorer }) => {
  const address = explorer.current;
  return (
    <Card title={`Address ${address.address}`}>
      <h3> Balance: </h3>
      {address.balance}
      <h3> Transactions: </h3>
      <TransctionList txs={address.txs} />
    </Card>
  );
};

Address.propTypes = {
  explorer: PropTypes.any,
};

export default inject('explorer')(observer(Address));
